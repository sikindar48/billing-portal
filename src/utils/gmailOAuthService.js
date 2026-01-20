import { supabase } from '@/integrations/supabase/client';

// Gmail OAuth Configuration
const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = import.meta.env.VITE_GMAIL_CLIENT_SECRET;

// Use localhost for development, production domain for production
const getRedirectUri = () => {
  const currentOrigin = window.location.origin;
  
  // For local development, use the current origin (handles both localhost and network IPs)
  if (currentOrigin.includes('localhost') || currentOrigin.includes('192.168') || currentOrigin.includes('127.0.0.1') || currentOrigin.includes('10.0.0')) {
    return `${currentOrigin}/gmail-callback`;
  }
  
  // For production
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

  console.log('=== Gmail OAuth Debug Info ===');
  console.log('Client ID:', GMAIL_CLIENT_ID);
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('Current Origin:', window.location.origin);
  console.log('Full OAuth URL:', authUrl.toString());
  console.log('============================');

  window.location.href = authUrl.toString();
};

/**
 * Exchange authorization code for access and refresh tokens
 * @param {string} authCode - Authorization code from OAuth callback
 * @returns {Promise<Object>} Token response
 */
export const exchangeCodeForTokens = async (authCode) => {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const tokenData = {
    client_id: GMAIL_CLIENT_ID,
    client_secret: GMAIL_CLIENT_SECRET,
    code: authCode,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI
  };

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await response.json();
    console.log('Tokens received:', { ...tokens, access_token: '[HIDDEN]', refresh_token: '[HIDDEN]' });
    
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Stored refresh token
 * @returns {Promise<Object>} New access token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const tokenData = {
    client_id: GMAIL_CLIENT_ID,
    client_secret: GMAIL_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

/**
 * Save Gmail tokens to user's business settings
 * @param {Object} tokens - OAuth tokens from Google
 * @param {string} userEmail - User's Gmail address
 */
export const saveGmailTokens = async (tokens, userEmail) => {
  try {
    console.log('Attempting to save Gmail tokens...');
    
    // Check authentication with detailed logging
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check result:', {
      hasUser: !!authData?.user,
      userId: authData?.user?.id,
      userEmail: authData?.user?.email,
      authError: authError?.message
    });
    
    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!authData?.user) {
      console.error('No user found in auth data');
      throw new Error('User not authenticated. Please log in and try again.');
    }

    const user = authData.user;
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    console.log('Saving tokens for user:', user.id);

    const { error } = await supabase
      .from('business_settings')
      .upsert({
        user_id: user.id,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_token_expires: expiresAt.toISOString(),
        gmail_email: userEmail,
        preferred_email_method: 'gmail'
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Gmail tokens saved successfully');
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { connected: false, error: 'User not authenticated' };
    }

    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('gmail_access_token, gmail_refresh_token, gmail_token_expires, gmail_email')
      .eq('user_id', user.id)
      .single();

    if (error || !settings) {
      return { connected: false, error: 'No Gmail settings found' };
    }

    if (!settings.gmail_refresh_token) {
      return { connected: false, error: 'No refresh token found' };
    }

    // Check if access token is expired
    const now = new Date();
    const expiresAt = new Date(settings.gmail_token_expires);
    
    if (now >= expiresAt) {
      // Try to refresh the token
      try {
        const newTokens = await refreshAccessToken(settings.gmail_refresh_token);
        await saveGmailTokens({
          ...newTokens,
          refresh_token: settings.gmail_refresh_token // Keep existing refresh token
        }, settings.gmail_email);
        
        return { 
          connected: true, 
          email: settings.gmail_email,
          tokenRefreshed: true 
        };
      } catch (refreshError) {
        return { 
          connected: false, 
          error: 'Token refresh failed', 
          details: refreshError.message 
        };
      }
    }

    return { 
      connected: true, 
      email: settings.gmail_email,
      expiresAt: settings.gmail_token_expires 
    };
  } catch (error) {
    console.error('Error checking Gmail connection:', error);
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

    const { error } = await supabase
      .from('business_settings')
      .update({
        gmail_access_token: null,
        gmail_refresh_token: null,
        gmail_token_expires: null,
        gmail_email: null,
        preferred_email_method: 'emailjs'
      })
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

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
      .from('business_settings')
      .select('gmail_access_token, gmail_refresh_token, gmail_token_expires')
      .eq('user_id', user.id)
      .single();

    if (error || !settings) {
      throw new Error('No Gmail settings found');
    }

    if (!settings.gmail_refresh_token) {
      throw new Error('Gmail not connected');
    }

    // Check if access token is expired
    const now = new Date();
    const expiresAt = new Date(settings.gmail_token_expires);
    
    if (now >= expiresAt) {
      // Refresh the token
      const newTokens = await refreshAccessToken(settings.gmail_refresh_token);
      await saveGmailTokens({
        ...newTokens,
        refresh_token: settings.gmail_refresh_token
      }, settings.gmail_email);
      
      return newTokens.access_token;
    }

    return settings.gmail_access_token;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw error;
  }
};