import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Generate and send OTP via secure Edge Function
 * @param {string} email - User's email address
 * @param {string} purpose - Purpose of OTP ('password_reset', 'email_verification', etc.)
 * @returns {Promise<{success: boolean, error?: string, otpId?: string}>}
 */
export const sendOTP = async (email, purpose = 'password_reset') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/request-otp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        purpose,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send OTP.' };
    }

    return { 
      success: true, 
      otpId: data.otpId,
      message: 'OTP sent successfully to your email address.' 
    };

  } catch (error) {
    console.error('Error in sendOTP:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

/**
 * Verify OTP code via secure RPC
 * @param {string} email - User's email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} purpose - Purpose of OTP verification
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verifyOTP = async (email, otpCode, purpose = 'password_reset') => {
  try {
    const { data, error } = await supabase.rpc('verify_otp_securely', {
      p_email: email.toLowerCase().trim(),
      p_otp_code: otpCode.trim(),
      p_purpose: purpose
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { 
      success: true, 
      message: 'OTP verified successfully.' 
    };

  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

/**
 * Check if user can request a new OTP (rate limiting)
 * @param {string} email - User's email address
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<{canRequest: boolean, waitTime?: number}>}
 */
export const canRequestNewOTP = async (email, purpose = 'password_reset') => {
  try {
    const emailLower = email.toLowerCase().trim();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    // Check for recent OTP requests (within last minute)
    const { data: recentOTPs, error } = await supabase
      .from('otp_verifications')
      .select('created_at')
      .eq('email', emailLower)
      .eq('purpose', purpose)
      .gt('created_at', oneMinuteAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking OTP rate limit:', error);
      return { canRequest: true }; // Allow request if we can't check
    }

    if (recentOTPs && recentOTPs.length > 0) {
      const lastRequestTime = new Date(recentOTPs[0].created_at);
      const waitTime = Math.ceil((60 * 1000 - (Date.now() - lastRequestTime.getTime())) / 1000);
      return { canRequest: false, waitTime };
    }

    return { canRequest: true };

  } catch (error) {
    console.error('Error in canRequestNewOTP:', error);
    return { canRequest: true }; // Allow request if error occurs
  }
};

/**
 * Clean up expired and used OTP codes for a specific email
 * @param {string} email - User's email address
 */
export const cleanupOTPCodes = async (email) => {
  try {
    const emailLower = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    await supabase
      .from('otp_verifications')
      .delete()
      .eq('email', emailLower)
      .or(`expires_at.lt.${now},and(verified.eq.true,verified_at.lt.${oneHourAgo})`);

  } catch (error) {
    console.error('Error cleaning up OTP codes:', error);
  }
};