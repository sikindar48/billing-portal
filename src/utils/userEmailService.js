import emailjs from '@emailjs/browser';
import { supabase } from '@/integrations/supabase/client';

// Initialize EmailJS
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Template IDs for different email types
const TEMPLATES = {
  INVOICE: import.meta.env.VITE_EMAILJS_INVOICE_TEMPLATE_ID,
  PAYMENT_REMINDER: import.meta.env.VITE_EMAILJS_PAYMENT_REMINDER_TEMPLATE_ID,
  PAYMENT_RECEIVED: import.meta.env.VITE_EMAILJS_PAYMENT_RECEIVED_TEMPLATE_ID,
  QUOTE: import.meta.env.VITE_EMAILJS_QUOTE_TEMPLATE_ID
};

// Debug logging
console.log('=== EMAIL SERVICE DEBUG ===');
console.log('EMAILJS_SERVICE_ID:', EMAILJS_SERVICE_ID);
console.log('EMAILJS_PUBLIC_KEY:', EMAILJS_PUBLIC_KEY);
console.log('INVOICE_TEMPLATE_ID:', TEMPLATES.INVOICE);
console.log('=== END DEBUG ===');

// Initialize EmailJS
if (emailjs && EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/**
 * Get user's business settings for email branding
 */
const getUserBusinessSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching business settings:', error);
      // Return default settings if user hasn't set up their business info yet
      return {
        company_name: 'My Business',
        company_email: null,
        company_phone: null,
        company_website: null,
        address_line1: null,
        city: null,
        state: null,
        country: 'India',
        logo_url: null,
        primary_color: '#6366f1',
        email_signature: null,
        email_footer: null
      };
    }

    return data;
  } catch (error) {
    console.error('Error in getUserBusinessSettings:', error);
    return null;
  }
};

/**
 * Send invoice email with user's branding via EmailJS
 */
export const sendInvoiceEmailViaEmailJS = async (invoiceData, userId) => {
  try {
    console.log('=== SENDING INVOICE EMAIL VIA EMAILJS ===');
    console.log('Invoice Data:', invoiceData);
    console.log('User ID:', userId);
    
    // Validate customer email
    if (!invoiceData.billTo?.email) {
      throw new Error('Customer email is required to send invoice');
    }

    // Check EmailJS configuration
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !TEMPLATES.INVOICE) {
      console.error('EmailJS Configuration Missing:', {
        serviceId: EMAILJS_SERVICE_ID ? 'Set' : 'Missing',
        publicKey: EMAILJS_PUBLIC_KEY ? 'Set' : 'Missing',
        templateId: TEMPLATES.INVOICE ? 'Set' : 'Missing'
      });
      throw new Error('EmailJS not properly configured. Please check environment variables.');
    }

    // Get user's business settings
    const businessSettings = await getUserBusinessSettings(userId);
    if (!businessSettings) {
      throw new Error('Could not fetch business settings');
    }

    console.log('Business Settings:', businessSettings);

    // Prepare comprehensive email template parameters
    const templateParams = {
      // Recipient
      to_email: invoiceData.billTo.email,
      to_name: invoiceData.billTo.name || 'Customer',
      
      // Invoice Details
      invoice_number: invoiceData.invoice.number,
      invoice_date: new Date(invoiceData.invoice.date).toLocaleDateString(),
      due_date: new Date(invoiceData.invoice.paymentDate).toLocaleDateString(),
      total_amount: invoiceData.grandTotal,
      currency: invoiceData.selectedCurrency || 'INR',
      currency_symbol: invoiceData.selectedCurrency === 'INR' ? '₹' : invoiceData.selectedCurrency === 'USD' ? '$' : invoiceData.selectedCurrency,
      
      // User's Business Information (Dynamic Branding)
      company_name: businessSettings.company_name || 'My Business',
      company_email: businessSettings.company_email || 'noreply@invoiceport.com',
      company_phone: businessSettings.company_phone || '',
      company_website: businessSettings.company_website || '',
      company_address: businessSettings.address_line1 || '',
      
      // Customer Information
      customer_name: invoiceData.billTo.name || 'Customer',
      customer_email: invoiceData.billTo.email,
      customer_phone: invoiceData.billTo.phone || '',
      customer_address: invoiceData.billTo.address || '',
      
      // Invoice Items (formatted for email)
      items_list: invoiceData.items?.map(item => 
        `${item.description || item.name} - Qty: ${item.quantity} - Rate: ${invoiceData.selectedCurrency === 'INR' ? '₹' : '$'}${item.amount} - Total: ${invoiceData.selectedCurrency === 'INR' ? '₹' : '$'}${item.total || (item.quantity * item.amount)}`
      ).join('\n') || 'No items',
      
      // Additional Details
      notes: invoiceData.notes || 'Thank you for your business!',
      tax_amount: invoiceData.taxAmount || 0,
      sub_total: invoiceData.subTotal || 0,
      
      // Email Branding
      email_signature: businessSettings.email_signature || `Best regards,\n${businessSettings.company_name || 'My Business'}`,
      email_footer: businessSettings.email_footer || `This invoice was generated by ${businessSettings.company_name || 'My Business'}`,
      
      // System
      current_year: new Date().getFullYear(),
      app_url: window.location.origin
    };

    console.log('Template Params:', templateParams);
    console.log('Sending to EmailJS with:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: TEMPLATES.INVOICE,
      recipientEmail: templateParams.to_email
    });

    // Re-initialize EmailJS to ensure it's ready
    emailjs.init(EMAILJS_PUBLIC_KEY);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.INVOICE,
      templateParams
    );

    console.log('Invoice email sent successfully via EmailJS:', result);
    return { 
      success: true, 
      result,
      method: 'emailjs',
      sentTo: invoiceData.billTo.email,
      sentFrom: businessSettings.company_email || 'noreply@invoiceport.com'
    };

  } catch (error) {
    console.error('Error sending invoice email via EmailJS:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      text: error.text,
      name: error.name
    });
    
    return { 
      success: false, 
      error: error.message || error.text || 'Unknown EmailJS error',
      method: 'emailjs'
    };
  }
};

/**
 * Send payment reminder with user's branding
 */
export const sendPaymentReminderEmail = async (invoiceData, clientEmail, userId, reminderType = 'gentle') => {
  try {
    const businessSettings = await getUserBusinessSettings(userId);
    if (!businessSettings) {
      throw new Error('Could not fetch business settings');
    }

    const templateParams = {
      to_email: clientEmail,
      to_name: invoiceData.clientName,
      
      invoice_number: invoiceData.invoiceNumber,
      original_due_date: invoiceData.dueDate,
      days_overdue: invoiceData.daysOverdue || 0,
      total_amount: invoiceData.totalAmount,
      currency: businessSettings.currency || 'INR',
      
      // User's branding
      company_name: businessSettings.company_name,
      company_email: businessSettings.company_email,
      company_phone: businessSettings.company_phone,
      
      reminder_type: reminderType, // gentle, firm, final
      
      email_signature: businessSettings.email_signature || `Best regards,\n${businessSettings.company_name}`,
      current_year: new Date().getFullYear()
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.PAYMENT_REMINDER,
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment received confirmation with user's branding
 */
export const sendPaymentReceivedEmail = async (paymentData, clientEmail, userId) => {
  try {
    const businessSettings = await getUserBusinessSettings(userId);
    if (!businessSettings) {
      throw new Error('Could not fetch business settings');
    }

    const templateParams = {
      to_email: clientEmail,
      to_name: paymentData.clientName,
      
      invoice_number: paymentData.invoiceNumber,
      payment_amount: paymentData.amount,
      payment_date: paymentData.date,
      payment_method: paymentData.method || 'Bank Transfer',
      currency: businessSettings.currency || 'INR',
      
      // User's branding
      company_name: businessSettings.company_name,
      company_email: businessSettings.company_email,
      
      email_signature: businessSettings.email_signature || `Thank you for your business!\n${businessSettings.company_name}`,
      current_year: new Date().getFullYear()
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.PAYMENT_RECEIVED,
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send quote/estimate with user's branding
 */
export const sendQuoteEmail = async (quoteData, clientEmail, userId) => {
  try {
    const businessSettings = await getUserBusinessSettings(userId);
    if (!businessSettings) {
      throw new Error('Could not fetch business settings');
    }

    const templateParams = {
      to_email: clientEmail,
      to_name: quoteData.clientName,
      
      quote_number: quoteData.quoteNumber,
      quote_date: quoteData.date,
      valid_until: quoteData.validUntil,
      total_amount: quoteData.totalAmount,
      currency: businessSettings.currency || 'INR',
      
      // User's branding
      company_name: businessSettings.company_name,
      company_email: businessSettings.company_email,
      company_phone: businessSettings.company_phone,
      company_website: businessSettings.company_website,
      
      quote_items: quoteData.items ? JSON.stringify(quoteData.items) : '',
      notes: quoteData.notes || '',
      
      email_signature: businessSettings.email_signature || `Best regards,\n${businessSettings.company_name}`,
      current_year: new Date().getFullYear()
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.QUOTE,
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    console.error('Error sending quote email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Utility function to validate email configuration
 */
export const validateEmailConfig = () => {
  const isConfigured = EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY && 
    EMAILJS_SERVICE_ID !== 'your_service_id_here' && 
    EMAILJS_PUBLIC_KEY !== 'your_public_key_here';
    
  return {
    isConfigured,
    serviceId: EMAILJS_SERVICE_ID ? 'Set' : 'Missing',
    publicKey: EMAILJS_PUBLIC_KEY ? 'Set' : 'Missing',
    templates: {
      invoice: TEMPLATES.INVOICE ? 'Set' : 'Missing',
      paymentReminder: TEMPLATES.PAYMENT_REMINDER ? 'Set' : 'Missing',
      paymentReceived: TEMPLATES.PAYMENT_RECEIVED ? 'Set' : 'Missing',
      quote: TEMPLATES.QUOTE ? 'Set' : 'Missing'
    }
  };
};