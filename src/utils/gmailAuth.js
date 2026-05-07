/**
 * Gmail OAuth Authentication - Simplified and Robust
 * This handles the complete OAuth flow for Gmail integration
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration
const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

/**
 * Get the correct redirect URI based on environment
 */
function getRedirectUri() {
  const origin = window.location.origin;
  
  // Force localhost for local development
  if (origin.includes('192.168') || origin.includes('10.0.') || origin.includes('127.0.0.1')) {
    return `http://localhost:${window.location.port || '8080'}/gmail-callback`;
  }
  
  return `${origin}/gmail-callback`;
}

/**
 * Start Gmail OAuth flow
 */
export function startGmailAuth() {
  if (!GMAIL_CLIENT_ID) {
    throw new Error('Gmail Client ID not configured. Please set VITE_GMAIL_CLIENT_ID in .env');
  }

  const redirectUri = getRedirectUri();
  const state = Math.random().toString(36).substring(7);
  
  // Store state for verification
  sessionStorage.setItem('gmail_oauth_state', state);
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  console.log('Starting Gmail OAuth with redirect URI:', redirectUri);
  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback and exchange code for tokens
 */
export async function handleGmailCallback(code, state) {
  // Verify state
  const savedState = sessionStorage.getItem('gmail_oauth_state');
  if (state && savedState && state !== savedState) {
    throw new Error('Invalid state parameter. Possible CSRF attack.');
  }
  sessionStorage.removeItem('gmail_oauth_state');

  if (!code) {
    throw new Error('No authorization code received');
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('You must be logged in to connect Gmail');
  }

  // Check Pro subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(slug)')
    .eq('user_id', user.id)
    .maybeSingle();

  const isPro = subscription?.subscription_plans?.slug === 'monthly' || 
                subscription?.subscription_plans?.slug === 'yearly';
  
  if (!isPro) {
    throw new Error('Gmail integration requires a Pro subscription');
  }

  // Exchange code for tokens via Edge Function
  const redirectUri = getRedirectUri();
  console.log('Exchanging code for tokens...');
  console.log('Redirect URI:', redirectUri);

  const { data, error } = await supabase.functions.invoke('gmail-token-exchange', {
    body: { code, redirect_uri: redirectUri }
  });

  console.log('Exchange response:', { data, error });

  // Handle errors
  if (error) {
    console.error('Edge Function error:', error);
    throw new Error(`Failed to exchange authorization code: ${error.message}`);
  }

  if (data?.error) {
    console.error('OAuth error:', data);
    
    if (data.error === 'server_config_error') {
      throw new Error('Server configuration error. Please contact support.');
    }
    
    if (data.error === 'invalid_grant') {
      throw new Error('Authorization code expired. Please try again.');
    }
    
    throw new Error(data.error_description || data.error);
  }

  if (!data?.access_token) {
    throw new Error('No access token received');
  }

  // Get user's email
  let userEmail;
  try {
    userEmail = await getGmailEmail(data.access_token);
  } catch (emailError) {
    console.warn('Could not fetch email automatically:', emailError);
    userEmail = prompt('Please enter your Gmail address:');
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error('Valid Gmail address required');
    }
  }

  // Save tokens
  await saveTokens(user.id, data, userEmail);

  return { email: userEmail, success: true };
}

/**
 * Get Gmail email address from access token
 */
async function getGmailEmail(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();
  return data.email;
}

/**
 * Save tokens to database
 */
async function saveTokens(userId, tokens, email) {
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

  // Get existing metadata
  const { data: existing } = await supabase
    .from('branding_settings')
    .select('metadata')
    .eq('user_id', userId)
    .maybeSingle();

  const metadata = {
    ...(existing?.metadata || {}),
    gmail_access_token: tokens.access_token,
    gmail_refresh_token: tokens.refresh_token,
    gmail_token_expires: expiresAt.toISOString(),
    gmail_email: email,
    preferred_email_method: 'gmail'
  };

  const { error } = await supabase
    .from('branding_settings')
    .upsert({
      user_id: userId,
      metadata
    }, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to save tokens: ${error.message}`);
  }
}

/**
 * Check if Gmail is connected
 */
export async function checkGmailConnection() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { connected: false };

    const { data: settings, error } = await supabase
      .from('branding_settings')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !settings?.metadata?.gmail_refresh_token) {
      return { connected: false };
    }

    const meta = settings.metadata;
    const expiresAt = new Date(meta.gmail_token_expires);
    const now = new Date();

    // If token expired, try to refresh
    if (now >= expiresAt) {
      try {
        await refreshToken(user.id, meta.gmail_refresh_token, meta.gmail_email);
        return { connected: true, email: meta.gmail_email };
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return { connected: false, error: 'Token expired' };
      }
    }

    return { 
      connected: true, 
      email: meta.gmail_email,
      expiresAt: meta.gmail_token_expires
    };
  } catch (error) {
    console.error('Error checking Gmail connection:', error);
    return { connected: false, error: error.message };
  }
}

/**
 * Refresh access token
 */
async function refreshToken(userId, refreshToken, email) {
  const { data, error } = await supabase.functions.invoke('gmail-token-refresh', {
    body: { refresh_token: refreshToken }
  });

  if (error || data?.error) {
    throw new Error('Token refresh failed');
  }

  await saveTokens(userId, {
    ...data,
    refresh_token: refreshToken
  }, email);

  return data.access_token;
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: settings } = await supabase
    .from('branding_settings')
    .select('metadata')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!settings?.metadata?.gmail_refresh_token) {
    throw new Error('Gmail not connected');
  }

  const meta = settings.metadata;
  const expiresAt = new Date(meta.gmail_token_expires);
  const now = new Date();

  // Refresh if expired
  if (now >= expiresAt) {
    return await refreshToken(user.id, meta.gmail_refresh_token, meta.gmail_email);
  }

  return meta.gmail_access_token;
}

/**
 * Disconnect Gmail
 */
export async function disconnectGmail() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('branding_settings')
    .select('metadata')
    .eq('user_id', user.id)
    .maybeSingle();

  const metadata = {
    ...(existing?.metadata || {}),
    gmail_access_token: null,
    gmail_refresh_token: null,
    gmail_token_expires: null,
    gmail_email: null,
    preferred_email_method: 'emailjs'
  };

  const { error } = await supabase
    .from('branding_settings')
    .update({ metadata })
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}

/**
 * Send email via Gmail
 */
export async function sendGmailEmail(emailData) {
  const accessToken = await getValidAccessToken();

  // Create RFC 2822 email
  const boundary = `boundary_${Date.now()}`;
  let message = '';
  message += `To: ${emailData.to}\r\n`;
  message += `From: ${emailData.from}\r\n`;
  if (emailData.replyTo) message += `Reply-To: ${emailData.replyTo}\r\n`;
  message += `Subject: ${emailData.subject}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
  message += emailData.html;

  // Encode to base64url
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Send via Gmail API
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send email');
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
}
