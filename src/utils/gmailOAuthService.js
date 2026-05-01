import { supabase } from '@/integrations/supabase/client';

// Gmail OAuth Configuration
// NOTE: VITE_GMAIL_CLIENT_SECRET must NOT be used here — it is compiled into the
// public bundle and visible to anyone. Token exchange and refresh must be proxied
// through a Supabase Edge Function. The client ID is safe to expose (public identifier).
const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;

// Use localhost for development, production domain for production
const getRedirectUri = () => {
  const currentOrigin = window.location.origin;
  
  // Always use localhost for local development — Google OAuth blocks private IPs (192.168.x.x)
  if (
    currentOrigin.includes('192.168') ||
    currentOrigin.includes('10.0.') ||
    currentOrigin.includes('127.0.0.1')
  ) {
    const port = window.location.port || '8080';
    return `http://localhost:${port}/gmail-callback`;
  }
  
  // localhost and production domains pass through as-is
  return `${currentOrigin}/gmail-callback`;
};

const REDIRECT_URI = getRedirectUri();

// Gmail OAuth Scopes
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Initiate Gmail OAuth flow
 * Redirects user to Google OAuth consent screen
 */
export const initiateGmailOAuth = () => {
  if (!GMAIL_CLIENT_ID) {
    throw new Error('Gmail Client ID not configured');
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GMAIL_SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  window.location.href = authUrl.toString();
};

/**
 * Exchange authorization code for access and refresh tokens.
 * Proxied through a Supabase Edge Function so the client secret never
 * touches the frontend bundle.
 * @param {string} authCode - Authorization code from OAuth callback
 * @returns {Promise<Object>} Token response
 */
export const exchangeCodeForTokens = async (authCode) => {
  if (!GMAIL_CLIENT_ID) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  try {
    const { data, error } = await supabase.functions.invoke('gmail-token-exchange', {
      body: { code: authCode, redirect_uri: REDIRECT_URI }
    });

    if (error) throw new Error(error.message || 'Token exchange failed');
    if (data?.error) throw new Error(data.error_description || data.error);

    return data;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token.
 * Proxied through a Supabase Edge Function so the client secret never
 * touches the frontend bundle.
 * @param {string} refreshToken - Stored refresh token
 * @returns {Promise<Object>} New access token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!GMAIL_CLIENT_ID) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  try {
    const { data, error } = await supabase.functions.invoke('gmail-token-refresh', {
      body: { refresh_token: refreshToken }
    });

    if (error) throw new Error(error.message || 'Token refresh failed');
    if (data?.error) throw new Error(data.error_description || data.error);

    return data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

/**
 * Save Gmail tokens to user's branding_settings metadata
 * @param {Object} tokens - OAuth tokens from Google
 * @param {string} userEmail - User's Gmail address
 */
export const saveGmailTokens = async (tokens, userEmail) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    if (!authData?.user) throw new Error('User not authenticated. Please log in and try again.');

    const user = authData.user;
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Read existing metadata first so we don't overwrite other fields
    const { data: existing } = await supabase
      .from('branding_settings')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle();

    const updatedMetadata = {
      ...(existing?.metadata || {}),
      gmail_access_token: tokens.access_token,
      gmail_refresh_token: tokens.refresh_token,
      gmail_token_expires: expiresAt.toISOString(),
      gmail_email: userEmail,
      preferred_email_method: 'gmail',
    };

    const { error } = await supabase
      .from('branding_settings')
      .upsert({
        user_id: user.id,
        metadata: updatedMetadata,
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error saving Gmail tokens:', error);
    throw error;
  }
};

/**
 * Get user's Gmail profile information
 * @param {string} accessToken - Valid access token
 * @returns {Promise<Object>} User profile data
 */
export const getGmailProfile = async (accessToken) => {
  try {
    // Try Gmail profile first
    let response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      return profile;
    }

    // If Gmail profile fails, try Google userinfo API
    console.log('Gmail profile failed, trying Google userinfo API...');
    response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userInfo = await response.json();
      // Convert to Gmail profile format
      return {
        emailAddress: userInfo.email,
        messagesTotal: 0,
        threadsTotal: 0,
        historyId: '0'
      };
    }

    throw new Error(`Both profile APIs failed: ${response.statusText}`);
  } catch (error) {
    console.error('Error getting Gmail profile:', error);
    throw error;
  }
};

/**
 * Check if user has valid Gmail connection
 * @returns {Promise<Object>} Connection status
 */
export const checkGmailConnection = async () => {
  try {
    // Use getSession() first — reads from local cache, no network call
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return { connected: false, error: 'User not authenticated' };
    }

    // Add a 5-second timeout to prevent infinite spinner
    const queryPromise = supabase
      .from('branding_settings')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 5000)
    );

    const { data: settings, error } = await Promise.race([queryPromise, timeoutPromise]);

    // No row yet = not connected, but not an error
    if (error) {
      return { connected: false, error: 'Failed to load settings' };
    }

    const meta = settings?.metadata || {};

    if (!meta.gmail_refresh_token) {
      return { connected: false, error: null };
    }

    // Check if access token is expired
    const now = new Date();
    const expiresAt = new Date(meta.gmail_token_expires);
    
    if (now >= expiresAt) {
      // Try to refresh the token
      try {
        const newTokens = await refreshAccessToken(meta.gmail_refresh_token);
        await saveGmailTokens({
          ...newTokens,
          refresh_token: meta.gmail_refresh_token
        }, meta.gmail_email);
        
        return { 
          connected: true, 
          email: meta.gmail_email,
          tokenRefreshed: true 
        };
      } catch (refreshError) {
        return { 
          connected: false, 
          error: 'Token refresh failed'
        };
      }
    }

    return { 
      connected: true, 
      email: meta.gmail_email,
      expiresAt: meta.gmail_token_expires
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

/**
 * Disconnect Gmail account
 * @returns {Promise<Object>} Disconnection result
 */
export const disconnectGmail = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Read existing metadata first
    const { data: existing } = await supabase
      .from('branding_settings')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle();

    const updatedMetadata = {
      ...(existing?.metadata || {}),
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_token_expires: null,
      gmail_email: null,
      preferred_email_method: 'emailjs',
    };

    const { error } = await supabase
      .from('branding_settings')
      .update({ metadata: updatedMetadata })
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via Gmail API
 * @param {Object} emailData - Email content and recipients
 * @param {string} accessToken - Valid Gmail access token
 * @returns {Promise<Object>} Send result
 */
export const sendViaGmail = async (emailData, accessToken) => {
  try {
    // Create email message in RFC 2822 format
    const emailMessage = createEmailMessage(emailData);
    
    // Encode message in base64url format
    const encodedMessage = btoa(emailMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gmail send failed: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Email sent via Gmail:', result.id);
    
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Error sending via Gmail:', error);
    throw error;
  }
};

/**
 * Create RFC 2822 formatted email message
 * @param {Object} emailData - Email content
 * @returns {string} Formatted email message
 */
const createEmailMessage = (emailData) => {
  const { to, subject, html, from, replyTo } = emailData;
  
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let message = '';
  message += `To: ${to}\r\n`;
  message += `From: ${from}\r\n`;
  if (replyTo) {
    message += `Reply-To: ${replyTo}\r\n`;
  }
  message += `Subject: ${subject}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
  
  // HTML part
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/html; charset=UTF-8\r\n`;
  message += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
  message += `${html}\r\n\r\n`;
  
  message += `--${boundary}--\r\n`;
  
  return message;
};

/**
 * Get valid access token (refresh if needed)
 * @returns {Promise<string>} Valid access token
 */
export const getValidAccessToken = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: settings, error } = await supabase
      .from('branding_settings')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error('Failed to load Gmail settings');
    }

    const meta = settings?.metadata || {};

    if (!meta.gmail_refresh_token) {
      throw new Error('Gmail not connected');
    }

    // Check if access token is expired
    const now = new Date();
    const expiresAt = new Date(meta.gmail_token_expires);
    
    if (now >= expiresAt) {
      // Refresh the token
      const newTokens = await refreshAccessToken(meta.gmail_refresh_token);
      await saveGmailTokens({
        ...newTokens,
        refresh_token: meta.gmail_refresh_token
      }, meta.gmail_email);
      
      return newTokens.access_token;
    }

    return meta.gmail_access_token;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw error;
  }
};