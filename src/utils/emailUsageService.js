// Email Usage Service - Handles plan-based email restrictions
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if user is admin (same logic as Dashboard)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user is admin
 */
const isAdminUser = async (userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check admin emails
    const adminEmails = ['nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com'];
    if (adminEmails.includes(user.email)) {
      return true;
    }

    // Check user roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    return !!roleData;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if user can send emails based on their subscription plan
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Email usage status
 */
export const checkEmailUsageLimit = async (userId) => {
  try {
    console.log('Checking email usage limit for user:', userId);
    
    // Check if user is admin first
    const isAdmin = await isAdminUser(userId);
    if (isAdmin) {
      console.log('User is admin, bypassing email limits');
      return {
        canSendEmail: true,
        currentUsage: 0,
        emailLimit: 999999,
        planName: 'Admin',
        isPro: true,
        isAdmin: true
      };
    }
    
    const { data, error } = await supabase.rpc('check_email_limit');
    
    if (error) {
      console.error('Error checking email limit:', error);
      // Default to trial limits on error
      return {
        canSendEmail: false,
        currentUsage: 0,
        emailLimit: 3,
        planName: 'Trial',
        isPro: false,
        isAdmin: false,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      // No subscription found, default to trial limits
      return {
        canSendEmail: false,
        currentUsage: 0,
        emailLimit: 3,
        planName: 'No Plan',
        isPro: false,
        isAdmin: false
      };
    }

    const result = data[0];
    console.log('Email usage check result:', result);

    return {
      canSendEmail: result.can_send_email,
      currentUsage: result.current_usage,
      emailLimit: result.email_limit,
      planName: result.plan_name,
      isPro: result.is_pro,
      isAdmin: false
    };
  } catch (error) {
    console.error('Error in checkEmailUsageLimit:', error);
    return {
      canSendEmail: false,
      currentUsage: 0,
      emailLimit: 3,
      planName: 'Error',
      isPro: false,
      isAdmin: false,
      error: error.message
    };
  }
};

/**
 * Log email usage and increment counter
 * @param {string} invoiceId - Invoice ID (optional)
 * @param {string} recipientEmail - Recipient email address
 * @param {string} emailMethod - Email method used ('emailjs', 'gmail')
 * @param {string} status - Email status ('sent', 'failed')
 * @param {string} errorMessage - Error message if failed (optional)
 * @returns {Promise<Object>} Log result
 */
export const logEmailUsage = async (invoiceId, recipientEmail, emailMethod, status, errorMessage = null) => {
  try {
    console.log('Logging email usage:', {
      invoiceId,
      recipientEmail,
      emailMethod,
      status,
      errorMessage
    });

    const { data, error } = await supabase.rpc('log_email_usage', {
      p_invoice_id: invoiceId,
      p_recipient_email: recipientEmail,
      p_email_method: emailMethod,
      p_status: status,
      p_error_message: errorMessage
    });

    if (error) {
      console.error('Error logging email usage:', error);
      
      // Fallback: try to increment usage directly if logging fails but email was sent
      if (status === 'sent') {
        console.log('Attempting fallback email usage increment...');
        const { error: incrementError } = await supabase.rpc('increment_email_usage');
        if (incrementError) {
          console.error('Fallback increment also failed:', incrementError);
        } else {
          console.log('Fallback increment successful');
        }
      }
      
      return { success: false, error: error.message };
    }

    console.log('Email usage logged successfully:', data);
    return { success: true, logId: data };
  } catch (error) {
    console.error('Error in logEmailUsage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's email usage history
 * @param {number} limit - Number of records to fetch (default: 50)
 * @returns {Promise<Object>} Email usage history
 */
export const getEmailUsageHistory = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('email_usage_log')
      .select(`
        id,
        recipient_email,
        email_method,
        status,
        error_message,
        sent_at,
        invoices(invoice_number)
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching email usage history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getEmailUsageHistory:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email usage statistics for dashboard
 * @returns {Promise<Object>} Email usage stats
 */
export const getEmailUsageStats = async () => {
  try {
    const usageCheck = await checkEmailUsageLimit();
    
    // If admin, return admin stats
    if (usageCheck.isAdmin) {
      return {
        ...usageCheck,
        recentActivity: {
          sent: 0,
          failed: 0,
          total: 0
        }
      };
    }
    
    // Get recent email activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentActivity, error } = await supabase
      .from('email_usage_log')
      .select('status, sent_at')
      .gte('sent_at', thirtyDaysAgo.toISOString())
      .order('sent_at', { ascending: false });

    if (error) {
      console.warn('Error fetching recent email activity:', error);
    }

    const sentEmails = recentActivity?.filter(log => log.status === 'sent').length || 0;
    const failedEmails = recentActivity?.filter(log => log.status === 'failed').length || 0;

    return {
      ...usageCheck,
      recentActivity: {
        sent: sentEmails,
        failed: failedEmails,
        total: sentEmails + failedEmails
      }
    };
  } catch (error) {
    console.error('Error in getEmailUsageStats:', error);
    return {
      canSendEmail: false,
      currentUsage: 0,
      emailLimit: 3,
      planName: 'Error',
      isPro: false,
      isAdmin: false,
      recentActivity: { sent: 0, failed: 0, total: 0 }
    };
  }
};

/**
 * Check if user has pro plan features
 * @returns {Promise<boolean>} True if user has pro plan or is admin
 */
export const hasProPlanFeatures = async () => {
  try {
    const usageCheck = await checkEmailUsageLimit();
    return usageCheck.isPro || usageCheck.isAdmin;
  } catch (error) {
    console.error('Error checking pro plan features:', error);
    return false;
  }
};

/**
 * Get plan-specific email method restrictions
 * @returns {Promise<Object>} Available email methods
 */
export const getAvailableEmailMethods = async () => {
  try {
    const usageCheck = await checkEmailUsageLimit();
    
    if (usageCheck.isPro || usageCheck.isAdmin) {
      // Pro users and admins get all email methods
      return {
        emailjs: true,
        gmail: true,
        professional: true,
        unlimited: true,
        isAdmin: usageCheck.isAdmin
      };
    } else {
      // Trial users get limited EmailJS only
      return {
        emailjs: true,
        gmail: false, // No Gmail for trial users
        professional: false,
        unlimited: false,
        isAdmin: false,
        restriction: 'Trial users can only send via InvoicePort mail (EmailJS)'
      };
    }
  } catch (error) {
    console.error('Error getting available email methods:', error);
    return {
      emailjs: true,
      gmail: false,
      professional: false,
      unlimited: false,
      isAdmin: false,
      error: error.message
    };
  }
};

/**
 * Validate email send request based on plan restrictions
 * @param {string} emailMethod - Requested email method
 * @returns {Promise<Object>} Validation result
 */
export const validateEmailSendRequest = async (emailMethod = 'emailjs') => {
  try {
    const usageCheck = await checkEmailUsageLimit();
    const availableMethods = await getAvailableEmailMethods();

    // Admin users bypass all restrictions
    if (usageCheck.isAdmin) {
      return {
        canSend: true,
        method: emailMethod,
        remainingEmails: 'unlimited',
        planName: 'Admin',
        isAdmin: true
      };
    }

    // Check usage limits
    if (!usageCheck.canSendEmail) {
      return {
        canSend: false,
        reason: 'usage_limit_exceeded',
        message: `Email limit reached (${usageCheck.currentUsage}/${usageCheck.emailLimit}). Upgrade to Pro for unlimited emails.`,
        currentUsage: usageCheck.currentUsage,
        emailLimit: usageCheck.emailLimit,
        planName: usageCheck.planName
      };
    }

    // Check method restrictions
    if (emailMethod === 'gmail' && !availableMethods.gmail) {
      return {
        canSend: false,
        reason: 'method_restricted',
        message: 'Gmail integration is only available for Pro users. Upgrade to send from your professional email address.',
        suggestedMethod: 'emailjs'
      };
    }

    return {
      canSend: true,
      method: emailMethod,
      remainingEmails: usageCheck.isPro ? 'unlimited' : (usageCheck.emailLimit - usageCheck.currentUsage),
      planName: usageCheck.planName,
      isAdmin: false
    };
  } catch (error) {
    console.error('Error validating email send request:', error);
    return {
      canSend: false,
      reason: 'validation_error',
      message: 'Unable to validate email request. Please try again.',
      error: error.message
    };
  }
};