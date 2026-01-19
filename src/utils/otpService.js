import { supabase } from '@/integrations/supabase/client';
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  privateKey: import.meta.env.VITE_EMAILJS_PRIVATE_KEY,
  otpTemplateId: import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID, // Reuse password reset template for OTP
};

/**
 * Generate a 6-digit OTP code
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate and send OTP via email
 * @param {string} email - User's email address
 * @param {string} purpose - Purpose of OTP ('password_reset', 'email_verification', etc.)
 * @returns {Promise<{success: boolean, error?: string, otpId?: string}>}
 */
export const sendOTP = async (email, purpose = 'password_reset') => {
  try {
    // Generate 6-digit OTP
    const otpCode = generateOTP();
    
    // Store OTP in database
    const { data: otpData, error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        email: email.toLowerCase().trim(),
        otp_code: otpCode,
        purpose,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error storing OTP:', dbError);
      return { success: false, error: 'Failed to generate OTP. Please try again.' };
    }

    // Send OTP via EmailJS
    const templateParams = {
      to_email: email,
      user_email: email,
      otp_code: otpCode,
      expires_in: '10 minutes',
      purpose: purpose === 'password_reset' ? 'Password Reset' : 'Email Verification',
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.otpTemplateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      return { 
        success: true, 
        otpId: otpData.id,
        message: 'OTP sent successfully to your email address.' 
      };
    } catch (emailError) {
      console.error('EmailJS error:', emailError);
      
      // Clean up the OTP record if email failed
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpData.id);

      return { success: false, error: 'Failed to send OTP email. Please try again.' };
    }

  } catch (error) {
    console.error('Error in sendOTP:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

/**
 * Verify OTP code
 * @param {string} email - User's email address
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} purpose - Purpose of OTP verification
 * @returns {Promise<{success: boolean, error?: string, otpId?: string}>}
 */
export const verifyOTP = async (email, otpCode, purpose = 'password_reset') => {
  try {
    const emailLower = email.toLowerCase().trim();
    const otpTrimmed = otpCode.trim();

    // Find the most recent valid OTP for this email and purpose
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', emailLower)
      .eq('purpose', purpose)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return { success: false, error: 'Invalid or expired OTP code.' };
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempts
    const newAttempts = otpRecord.attempts + 1;

    // Check if OTP code matches
    if (otpRecord.otp_code !== otpTrimmed) {
      // Update attempts count
      await supabase
        .from('otp_verifications')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      const remainingAttempts = otpRecord.max_attempts - newAttempts;
      if (remainingAttempts > 0) {
        return { 
          success: false, 
          error: `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.` 
        };
      } else {
        return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
      }
    }

    // OTP is valid - mark as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ 
        verified: true, 
        verified_at: new Date().toISOString(),
        attempts: newAttempts 
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error updating OTP verification:', updateError);
      return { success: false, error: 'Failed to verify OTP. Please try again.' };
    }

    return { 
      success: true, 
      otpId: otpRecord.id,
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