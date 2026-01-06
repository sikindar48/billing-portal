import emailjs from '@emailjs/browser';

// Initialize EmailJS with multiple template support
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Debug environment variables
console.log('=== EMAILJS ENV VARS DEBUG ===');
console.log('VITE_EMAILJS_SERVICE_ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
console.log('VITE_EMAILJS_PUBLIC_KEY:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
console.log('VITE_EMAILJS_WELCOME_TEMPLATE_ID:', import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID);
console.log('VITE_EMAILJS_INVOICE_TEMPLATE_ID:', import.meta.env.VITE_EMAILJS_INVOICE_TEMPLATE_ID);
console.log('Loaded Service ID:', EMAILJS_SERVICE_ID);
console.log('Loaded Public Key:', EMAILJS_PUBLIC_KEY);

// Check if EmailJS is properly loaded and initialize
if (!emailjs) {
  console.error('EmailJS not loaded! Make sure @emailjs/browser is installed.');
} else {
  // Initialize EmailJS with public key
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('EmailJS initialized with public key:', EMAILJS_PUBLIC_KEY);
}

// Multiple Template IDs for different email types
const TEMPLATES = {
  WELCOME: import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID,
  CONFIRMATION: import.meta.env.VITE_EMAILJS_CONFIRMATION_TEMPLATE_ID,
  PASSWORD_RESET: import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID,
  SUBSCRIPTION: import.meta.env.VITE_EMAILJS_SUBSCRIPTION_TEMPLATE_ID,
  ORDER_CONFIRMATION: import.meta.env.VITE_EMAILJS_ORDER_CONFIRMATION_TEMPLATE_ID,
  PAYMENT_CONFIRMATION: import.meta.env.VITE_EMAILJS_PAYMENT_CONFIRMATION_TEMPLATE_ID
};

// Helper function to check if EmailJS is configured
const isEmailJSConfigured = (templateType = 'WELCOME') => {
  const checks = {
    serviceId: EMAILJS_SERVICE_ID && EMAILJS_SERVICE_ID !== 'your_service_id_here',
    publicKey: EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'your_public_key_here',
    template: TEMPLATES[templateType] && TEMPLATES[templateType] !== `your_${templateType.toLowerCase()}_template_id_here`
  };
  
  console.log(`EmailJS Configuration Check (${templateType}):`, {
    serviceId: checks.serviceId ? 'Set' : 'Missing',
    publicKey: checks.publicKey ? 'Set' : 'Missing', 
    template: checks.template ? 'Set' : 'Missing',
    templateId: TEMPLATES[templateType],
    actualValues: {
      serviceId: EMAILJS_SERVICE_ID,
      publicKey: EMAILJS_PUBLIC_KEY,
      templateId: TEMPLATES[templateType]
    }
  });
  
  return checks.serviceId && checks.publicKey && checks.template;
};

// Generic email sending function
const sendEmail = async (templateType, templateParams) => {
  try {
    console.log(`=== SENDING ${templateType} EMAIL ===`);
    console.log('EmailJS Service ID:', EMAILJS_SERVICE_ID);
    console.log('EmailJS Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Template ID:', TEMPLATES[templateType]);
    console.log('Template Params:', templateParams);

    if (!isEmailJSConfigured(templateType)) {
      const configError = `EmailJS not configured for ${templateType} template`;
      console.error(configError);
      return { 
        success: false, 
        error: configError
      };
    }

    console.log(`Attempting to send ${templateType} email...`);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES[templateType],
      templateParams
    );

    console.log(`${templateType} email SUCCESS:`, result);
    return { success: true, result };
  } catch (error) {
    console.error(`Error sending ${templateType} email:`, error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      text: error.text,
      stack: error.stack
    });
    return { 
      success: false, 
      error: error.message || error.text || 'Unknown EmailJS error'
    };
  }
};

export const testEmailJSConnection = async () => {
  try {
    console.log('=== TESTING EMAILJS CONNECTION ===');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Welcome Template ID:', TEMPLATES.WELCOME);
    
    // Check configuration first
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === 'your_service_id_here') {
      return { success: false, error: 'Service ID not configured' };
    }
    
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'your_public_key_here') {
      return { success: false, error: 'Public key not configured' };
    }

    if (!TEMPLATES.WELCOME || TEMPLATES.WELCOME === 'your_welcome_template_id_here') {
      return { success: false, error: 'Welcome template ID not configured' };
    }

    // Re-initialize EmailJS to be sure
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Test with minimal template parameters
    const testParams = {
      to_email: 'test@example.com',
      to_name: 'Test User',
      company_name: 'InvoicePort',
      app_url: window.location.origin,
      support_email: 'support.invoiceport@gmail.com',
      current_year: new Date().getFullYear()
    };

    console.log('Sending test email with params:', testParams);
    console.log('Using service:', EMAILJS_SERVICE_ID);
    console.log('Using template:', TEMPLATES.WELCOME);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.WELCOME,
      testParams
    );

    console.log('EmailJS test SUCCESS:', result);
    return { success: true, result };
  } catch (error) {
    console.error('EmailJS test ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      text: error.text,
      name: error.name
    });
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
  console.log('=== WELCOME EMAIL DEBUG ===');
  console.log('Attempting to send welcome email to:', userEmail, 'Name:', userName);
  
  const templateParams = {
    to_name: userName,
    to_email: userEmail, // EmailJS needs this to know where to send
    company_name: 'InvoicePort',
    app_url: window.location.origin,
    support_email: 'support.invoiceport@gmail.com',
    current_year: new Date().getFullYear()
  };

  console.log('Template params:', templateParams);
  
  const result = await sendEmail('WELCOME', templateParams);
  console.log('Welcome email result:', result);
  console.log('=== END WELCOME EMAIL DEBUG ===');
  
  return result;
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
  try {
    console.log('=== SENDING ORDER CONFIRMATION EMAIL ===');
    console.log('Customer Email:', userEmail);
    console.log('Order Details:', orderDetails);

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

    console.log('Sending order confirmation email with template params:', templateParams);

    return await sendEmail('ORDER_CONFIRMATION', templateParams);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
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