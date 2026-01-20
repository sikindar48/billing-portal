// Unified Invoice Email Service - Routes to Gmail or EmailJS based on user preference and plan
import { sendInvoiceViaGmail, isGmailConnected } from './gmailInvoiceService';
import { sendInvoiceEmailViaEmailJS } from './userEmailService';
import { supabase } from '@/integrations/supabase/client';
import { 
  checkEmailUsageLimit, 
  logEmailUsage, 
  validateEmailSendRequest,
  getAvailableEmailMethods 
} from './emailUsageService';

/**
 * Get user's email method preference with plan restrictions
 */
const getEmailMethodPreference = async (userId) => {
  try {
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('preferred_email_method, gmail_refresh_token')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Could not fetch email preferences, defaulting to EmailJS');
      return 'emailjs';
    }

    // Check plan restrictions
    const availableMethods = await getAvailableEmailMethods();
    
    // If user prefers Gmail but doesn't have pro plan, force EmailJS
    if (settings.preferred_email_method === 'gmail' && !availableMethods.gmail) {
      console.log('Gmail requested but not available for current plan, using EmailJS');
      return 'emailjs';
    }

    // Check if Gmail is preferred and actually connected
    if (settings.preferred_email_method === 'gmail' && settings.gmail_refresh_token && availableMethods.gmail) {
      return 'gmail';
    }

    return 'emailjs';
  } catch (error) {
    console.error('Error getting email method preference:', error);
    return 'emailjs';
  }
};

/**
 * Send invoice email using the best available method with plan restrictions
 * Priority: Gmail OAuth (Pro only) > EmailJS with branding
 */
export const sendInvoiceEmail = async (invoiceData, userId) => {
  try {
    console.log('=== UNIFIED INVOICE EMAIL SERVICE ===');
    
    // Validate required data
    if (!invoiceData.billTo?.email) {
      return {
        success: false,
        error: 'Customer email is required. Please add an email address in the "Bill To" section.',
        method: 'none'
      };
    }

    if (!userId) {
      return {
        success: false,
        error: 'User authentication required',
        method: 'none'
      };
    }

    // Check email usage limits and plan restrictions
    const usageValidation = await validateEmailSendRequest();
    if (!usageValidation.canSend) {
      return {
        success: false,
        error: usageValidation.message,
        reason: usageValidation.reason,
        method: 'restricted',
        currentUsage: usageValidation.currentUsage,
        emailLimit: usageValidation.emailLimit,
        planName: usageValidation.planName
      };
    }

    // Determine the best email method based on plan and preferences
    const preferredMethod = await getEmailMethodPreference(userId);
    console.log('Preferred email method:', preferredMethod);
    console.log('Plan allows method:', preferredMethod);

    let result;
    let invoiceId = null;

    // Try to get invoice ID if it exists
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('invoice_number', invoiceData.invoice.number)
        .eq('user_id', userId)
        .single();
      invoiceId = invoice?.id;
    } catch (error) {
      console.warn('Could not find invoice ID for logging:', error);
    }

    if (preferredMethod === 'gmail') {
      console.log('Attempting to send via Gmail (Pro feature)...');
      result = await sendInvoiceViaGmail(invoiceData, userId);
      
      // Log the attempt
      await logEmailUsage(
        invoiceId,
        invoiceData.billTo.email,
        'gmail',
        result.success ? 'sent' : 'failed',
        result.success ? null : result.error
      );
      
      // If Gmail fails, fallback to EmailJS
      if (!result.success) {
        console.log('Gmail failed, falling back to EmailJS:', result.error);
        result = await sendInvoiceEmailViaEmailJS(invoiceData, userId);
        result.fallbackUsed = true;
        result.originalError = result.error;
        
        // Log the fallback attempt
        await logEmailUsage(
          invoiceId,
          invoiceData.billTo.email,
          'emailjs',
          result.success ? 'sent' : 'failed',
          result.success ? null : result.error
        );
      }
    } else {
      console.log('Sending via EmailJS (Trial/Basic method)...');
      result = await sendInvoiceEmailViaEmailJS(invoiceData, userId);
      
      // Log the attempt
      await logEmailUsage(
        invoiceId,
        invoiceData.billTo.email,
        'emailjs',
        result.success ? 'sent' : 'failed',
        result.success ? null : result.error
      );
    }

    // Add additional metadata
    result.customerEmail = invoiceData.billTo.email;
    result.customerName = invoiceData.billTo.name;
    result.invoiceNumber = invoiceData.invoice.number;
    result.timestamp = new Date().toISOString();
    result.planRestricted = !usageValidation.canSend;
    
    // Calculate remaining emails after sending (if successful)
    if (result.success && usageValidation.remainingEmails !== 'unlimited') {
      // Subtract 1 from the original remaining count since we just sent an email
      const newRemainingCount = parseInt(usageValidation.remainingEmails) - 1;
      result.remainingEmails = Math.max(0, newRemainingCount);
    } else {
      result.remainingEmails = usageValidation.remainingEmails;
    }

    console.log('Invoice email result:', {
      success: result.success,
      method: result.method,
      sentTo: result.sentTo,
      error: result.error,
      remainingEmails: result.remainingEmails
    });

    return result;

  } catch (error) {
    console.error('Error in unified invoice email service:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending email',
      method: 'error'
    };
  }
};

/**
 * Get email sending status and capabilities for user with plan restrictions
 */
export const getEmailCapabilities = async (userId) => {
  try {
    const gmailConnected = await isGmailConnected(userId);
    const preferredMethod = await getEmailMethodPreference(userId);
    const availableMethods = await getAvailableEmailMethods();
    const usageStats = await checkEmailUsageLimit(userId);

    return {
      gmailConnected,
      preferredMethod,
      availableMethods: {
        gmail: availableMethods.gmail && gmailConnected,
        emailjs: availableMethods.emailjs
      },
      recommendation: (availableMethods.gmail && gmailConnected) ? 'gmail' : 'emailjs',
      usageStats,
      planRestrictions: {
        isPro: availableMethods.professional,
        unlimited: availableMethods.unlimited,
        restriction: availableMethods.restriction
      }
    };
  } catch (error) {
    console.error('Error getting email capabilities:', error);
    return {
      gmailConnected: false,
      preferredMethod: 'emailjs',
      availableMethods: {
        gmail: false,
        emailjs: true
      },
      recommendation: 'emailjs',
      usageStats: {
        canSendEmail: false,
        currentUsage: 0,
        emailLimit: 3,
        planName: 'Error',
        isPro: false
      },
      planRestrictions: {
        isPro: false,
        unlimited: false,
        restriction: 'Error loading plan information'
      }
    };
  }
};

/**
 * Validate invoice data before sending
 */
export const validateInvoiceForEmail = (invoiceData) => {
  const errors = [];

  if (!invoiceData.billTo?.email) {
    errors.push('Customer email is required');
  }

  if (!invoiceData.billTo?.name) {
    errors.push('Customer name is required');
  }

  if (!invoiceData.invoice?.number) {
    errors.push('Invoice number is required');
  }

  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.push('At least one invoice item is required');
  }

  if (!invoiceData.grandTotal || invoiceData.grandTotal <= 0) {
    errors.push('Invoice total must be greater than zero');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};