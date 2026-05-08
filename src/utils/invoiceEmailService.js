// Unified Invoice Email Service - Routes to Gmail or EmailJS based on user preference and plan
import { sendInvoiceViaGmail, isGmailConnected } from './gmailInvoiceService';
import { supabase } from '@/integrations/supabase/client';
import { 
  checkEmailUsageLimit, 
  logEmailUsage, 
  validateEmailSendRequest,
  getAvailableEmailMethods 
} from './emailUsageService';

/**
 * Send invoice email via InvoicePort Default Mail
 */
export const sendInvoiceEmailViaDefaultMail = async (invoiceData, userId, usageValidation) => {
  try {
    // Get user's business name for the sender info
    const { data: business } = await supabase
      .from('business_settings')
      .select('company_name')
      .eq('user_id', userId)
      .maybeSingle();

    const verifyUrl = `${window.location.origin}/verify-invoice?number=${invoiceData.invoice.number}`;
    console.log(`Email Service: Preparing to send invoice #${invoiceData.invoice.number} to ${invoiceData.billTo.email}`);
    
    // Ensure all required objects exist to prevent template crashes
    const safeInvoiceData = {
      ...invoiceData,
      billTo: invoiceData.billTo || {},
      shipTo: invoiceData.shipTo || {},
      yourCompany: invoiceData.yourCompany || {},
      items: invoiceData.items || []
    };
    
    // Generate PDF attachment (Pro only after 3 emails)
    let pdfBase64 = null;
    const canAttachPDF = usageValidation.isPro || usageValidation.isAdmin || (usageValidation.currentUsage < 3);
    
    if (canAttachPDF) {
      try {
        console.log('Email Service: Generating PDF for attachment...');
        const { generatePDFBase64 } = await import('./pdfGenerator');
        pdfBase64 = await generatePDFBase64(safeInvoiceData, invoiceData.selectedTemplateId || 1);
        
        if (pdfBase64 && pdfBase64.length > 100) {
          console.log(`Email Service: PDF generated successfully. Size: ${Math.round(pdfBase64.length / 1024)} KB`);
        } else {
          console.error('Email Service: PDF generation failed or returned empty content!');
        }
      } catch (pdfError) {
        console.error('Email Service: PDF generation error:', pdfError);
      }
    } else {
      console.log('Email Service: PDF attachment skipped (Trial limit reached)');
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'invoice',
        to: invoiceData.billTo.email,
        user_name: business?.company_name || 'Service Provider',
        invoice_number: invoiceData.invoice.number,
        amount: invoiceData.grandTotal.toString(),
        currency: invoiceData.selectedCurrency === 'INR' ? '₹' : '$',
        due_date: invoiceData.invoice.paymentDate,
        verify_url: verifyUrl,
        attachment: pdfBase64, // Will be null for free users > 3 emails
        is_pro: usageValidation.isPro || usageValidation.isAdmin
      }
    });

    if (error) throw error;

    return { 
      success: true, 
      method: 'default_mail',
      id: data.id 
    };
  } catch (error) {
    console.error('Error sending email via Default Mail:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via Default Mail',
      method: 'default_mail'
    };
  }
};

/**
 * Get user's email method preference with plan restrictions
 */
const getEmailMethodPreference = async (userId) => {
  try {
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('preferred_email_method, gmail_refresh_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch email preferences, defaulting to Default Mail');
      return 'default_mail';
    }

    // Check plan restrictions
    const availableMethods = await getAvailableEmailMethods();
    
    // If user prefers Gmail but doesn't have pro plan, force Default Mail
    if (settings.preferred_email_method === 'gmail' && !availableMethods.gmail) {
      return 'default_mail';
    }

    // Check if Gmail is preferred and actually connected
    if (settings.preferred_email_method === 'gmail' && settings.gmail_refresh_token && availableMethods.gmail) {
      return 'gmail';
    }

    return 'default_mail';
  } catch (error) {
    console.error('Error getting email method preference:', error);
    return 'default_mail';
  }
};

/**
 * Send invoice email using the best available method with plan restrictions
 * Priority: Gmail OAuth (Pro only) > InvoicePort Default Mail
 */
export const sendInvoiceEmail = async (invoiceData, userId) => {
  try {
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

    let result;
    let invoiceId = null;

    // Try to get invoice ID if it exists
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('invoice_number', invoiceData.invoice.number)
        .eq('user_id', userId)
        .maybeSingle();
      invoiceId = invoice?.id;
    } catch (error) {
      console.warn('Could not find invoice ID for logging:', error);
    }

    if (preferredMethod === 'gmail') {
      result = await sendInvoiceViaGmail(invoiceData, userId);
      
      // Log the attempt
      await logEmailUsage(
        invoiceId,
        invoiceData.billTo.email,
        'gmail',
        result.success ? 'sent' : 'failed',
        result.success ? null : result.error
      );
      
      // If Gmail fails, fallback to Default Mail
      if (!result.success) {
        result = await sendInvoiceEmailViaDefaultMail(invoiceData, userId, usageValidation);
        result.fallbackUsed = true;
        result.originalError = result.error;
        
        // Log the fallback attempt
        await logEmailUsage(
          invoiceId,
          invoiceData.billTo.email,
          'default_mail',
          result.success ? 'sent' : 'failed',
          result.success ? null : result.error
        );
      }
    } else {
      result = await sendInvoiceEmailViaDefaultMail(invoiceData, userId, usageValidation);
      
      // Log the attempt
      await logEmailUsage(
        invoiceId,
        invoiceData.billTo.email,
        'default_mail',
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
        default_mail: true
      },
      recommendation: (availableMethods.gmail && gmailConnected) ? 'gmail' : 'default_mail',
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
      preferredMethod: 'default_mail',
      availableMethods: {
        gmail: false,
        default_mail: true
      },
      recommendation: 'default_mail',
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