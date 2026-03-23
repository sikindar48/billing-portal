import emailjs from '@emailjs/browser';

// Initialize EmailJS with multiple template support
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize EmailJS once at module load
if (emailjs) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Multiple Template IDs for different email types
const TEMPLATES = {
  WELCOME: import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID,
  CONFIRMATION: import.meta.env.VITE_EMAILJS_CONFIRMATION_TEMPLATE_ID,
  PASSWORD_RESET: import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID,
  SUBSCRIPTION: import.meta.env.VITE_EMAILJS_SUBSCRIPTION_TEMPLATE_ID,
  ORDER_CONFIRMATION: import.meta.env.VITE_EMAILJS_ORDER_CONFIRMATION_TEMPLATE_ID,
  PAYMENT_CONFIRMATION: import.meta.env.VITE_EMAILJS_PAYMENT_CONFIRMATION_TEMPLATE_ID,
  PAYMENT_VERIFICATION: import.meta.env.VITE_EMAILJS_PAYMENT_VERIFICATION_TEMPLATE_ID
};

// Helper function to check if EmailJS is configured
const isEmailJSConfigured = (templateType = 'WELCOME') => {
  const checks = {
    serviceId: EMAILJS_SERVICE_ID && EMAILJS_SERVICE_ID !== 'your_service_id_here',
    publicKey: EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'your_public_key_here',
    template: TEMPLATES[templateType] && TEMPLATES[templateType] !== `your_${templateType.toLowerCase()}_template_id_here`
  };
  return checks.serviceId && checks.publicKey && checks.template;
};

// Generic email sending function
const sendEmail = async (templateType, templateParams) => {
  try {
    if (!isEmailJSConfigured(templateType)) {
      return { 
        success: false, 
        error: `EmailJS not configured for ${templateType} template`
      };
    }

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES[templateType],
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || error.text || 'Unknown EmailJS error'
    };
  }
};

export const testEmailJSConnection = async () => {
  try {
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === 'your_service_id_here') {
      return { success: false, error: 'Service ID not configured' };
    }
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'your_public_key_here') {
      return { success: false, error: 'Public key not configured' };
    }
    if (!TEMPLATES.WELCOME || TEMPLATES.WELCOME === 'your_welcome_template_id_here') {
      return { success: false, error: 'Welcome template ID not configured' };
    }

    const testParams = {
      to_email: 'test@example.com',
      to_name: 'Test User',
      company_name: 'InvoicePort',
      app_url: window.location.origin,
      support_email: 'support.invoiceport@gmail.com',
      current_year: new Date().getFullYear()
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.WELCOME,
      testParams
    );

    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || error.text || error.toString() || 'Unknown error'
    };
  }
};

export const sendConfirmationEmail = async (userEmail, userName, confirmationUrl) => {
  const templateParams = {
    to_email: userEmail,
    to_name: userName,
    confirmation_url: confirmationUrl,
    company_name: 'InvoicePort',
    app_url: window.location.origin,
    support_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  return await sendEmail('CONFIRMATION', templateParams);
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  const templateParams = {
    to_name: userName,
    to_email: userEmail,
    company_name: 'InvoicePort',
    app_url: window.location.origin,
    support_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  return await sendEmail('WELCOME', templateParams);
};

export const sendPasswordResetEmail = async (userEmail) => {
  const templateParams = {
    to_email: userEmail,
    company_name: 'InvoicePort',
    app_url: window.location.origin,
    support_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  return await sendEmail('PASSWORD_RESET', templateParams);
};

export const sendSubscriptionConfirmationEmail = async (userEmail, userName, planName, amount) => {
  const templateParams = {
    to_email: userEmail,
    to_name: userName,
    plan_name: planName,
    amount: amount,
    company_name: 'InvoicePort',
    app_url: window.location.origin,
    support_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  return await sendEmail('SUBSCRIPTION', templateParams);
};

export const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
  const templateParams = {
    to_email: userEmail,
    to_name: userName,
    order_number: orderDetails.orderNumber,
    order_date: orderDetails.orderDate,
    plan_name: orderDetails.planName,
    amount_paid: orderDetails.amountPaid,
    payment_method: orderDetails.paymentMethod || 'UPI',
    billing_cycle: orderDetails.billingCycle || 'Monthly',
    next_billing_date: orderDetails.nextBillingDate,
    company_name: 'InvoicePort',
    company_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  return await sendEmail('ORDER_CONFIRMATION', templateParams);
};

export const sendPaymentConfirmationEmail = async (userEmail, userName, planName, amount, paymentMethod = 'UPI') => {
  const templateParams = {
    to_email: userEmail,
    to_name: userName,
    plan_name: planName,
    amount: amount,
    payment_method: paymentMethod,
    company_name: 'InvoicePort',
    app_url: window.location.origin,
    support_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  return await sendEmail('PAYMENT_CONFIRMATION', templateParams);
};

export const sendPaymentVerificationNotification = async (userEmail, userName, planName, amount, transactionId, billingCycle, requestId, userId) => {
  try {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAILS?.split(',')[0] || 'nayabsikindar48@gmail.com';
    const baseUrl = window.location.origin;
    const verificationUrl = `${baseUrl}/admin/verify-payment?request_id=${requestId}&user_id=${userId}`;

    const templateParams = {
      to_email: adminEmail,
      admin_email: adminEmail,
      user_email: userEmail,
      user_name: userName,
      plan_name: planName,
      amount: amount,
      transaction_id: transactionId,
      billing_cycle: billingCycle,
      payment_method: 'UPI',
      upi_id: 'invoiceport@ybl',
      submission_date: new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      verification_url: verificationUrl,
      request_id: requestId,
      user_id: userId,
      company_name: 'InvoicePort',
      app_url: window.location.origin,
      current_year: new Date().getFullYear()
    };

    const adminServiceId = import.meta.env.VITE_EMAILJS_ADMIN_SERVICE_ID || EMAILJS_SERVICE_ID;
    const adminPublicKey = import.meta.env.VITE_EMAILJS_ADMIN_PUBLIC_KEY || EMAILJS_PUBLIC_KEY;
    const templateId = import.meta.env.VITE_EMAILJS_PAYMENT_VERIFICATION_TEMPLATE_ID;

    const result = await emailjs.send(
      adminServiceId,
      templateId,
      templateParams,
      adminPublicKey
    );

    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
