// Advanced Email Service with Multiple Delivery Options
import { supabase } from '@/integrations/supabase/client';

/**
 * SOLUTION 1: SMTP Email Service (Recommended)
 * Users configure their own email SMTP settings
 */

// Add SMTP settings to business_settings table
const addSMTPSettings = `
  -- Add SMTP configuration to business_settings table
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT;
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587;
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS smtp_username TEXT;
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS smtp_password TEXT; -- Encrypted
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true;
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS email_provider TEXT DEFAULT 'gmail'; -- gmail, outlook, custom
`;

/**
 * Get user's SMTP settings
 */
const getUserSMTPSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('smtp_host, smtp_port, smtp_username, smtp_password, smtp_secure, email_provider, company_email')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return null;
  }
};

/**
 * SOLUTION 1A: Server-Side SMTP (Backend Required)
 * Send email through user's own SMTP server
 */
export const sendEmailViaSMTP = async (emailData, userId) => {
  try {
    const smtpSettings = await getUserSMTPSettings(userId);
    if (!smtpSettings || !smtpSettings.smtp_host) {
      throw new Error('SMTP settings not configured');
    }

    // This would need to be implemented on your backend server
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        smtpConfig: {
          host: smtpSettings.smtp_host,
          port: smtpSettings.smtp_port,
          secure: smtpSettings.smtp_secure,
          auth: {
            user: smtpSettings.smtp_username,
            pass: smtpSettings.smtp_password // Should be encrypted
          }
        },
        emailData: {
          from: smtpSettings.company_email,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          attachments: emailData.attachments
        }
      })
    });

    const result = await response.json();
    return { success: response.ok, result };
  } catch (error) {
    console.error('SMTP email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * SOLUTION 2: Third-Party Email Services
 * Integration with professional email services
 */

/**
 * 2A: SendGrid Integration
 */
export const sendEmailViaSendGrid = async (emailData, userId) => {
  try {
    const businessSettings = await getUserBusinessSettings(userId);
    
    // User needs to configure their SendGrid API key
    if (!businessSettings.sendgrid_api_key) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${businessSettings.sendgrid_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to, name: emailData.toName }],
          subject: emailData.subject
        }],
        from: {
          email: businessSettings.company_email,
          name: businessSettings.company_name
        },
        content: [{
          type: 'text/html',
          value: emailData.html
        }],
        attachments: emailData.attachments
      })
    });

    return { success: response.ok, result: await response.json() };
  } catch (error) {
    console.error('SendGrid email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 2B: Mailgun Integration
 */
export const sendEmailViaMailgun = async (emailData, userId) => {
  try {
    const businessSettings = await getUserBusinessSettings(userId);
    
    if (!businessSettings.mailgun_api_key || !businessSettings.mailgun_domain) {
      throw new Error('Mailgun settings not configured');
    }

    const formData = new FormData();
    formData.append('from', `${businessSettings.company_name} <${businessSettings.company_email}>`);
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('html', emailData.html);

    const response = await fetch(`https://api.mailgun.net/v3/${businessSettings.mailgun_domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${businessSettings.mailgun_api_key}`)}`
      },
      body: formData
    });

    return { success: response.ok, result: await response.json() };
  } catch (error) {
    console.error('Mailgun email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * SOLUTION 3: Gmail API Integration
 * Users connect their Gmail account
 */
export const sendEmailViaGmailAPI = async (emailData, userId) => {
  try {
    // User needs to authenticate with Gmail OAuth
    const accessToken = await getGmailAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('Gmail authentication required');
    }

    // Create email message
    const email = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      emailData.html
    ].join('\n');

    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    return { success: response.ok, result: await response.json() };
  } catch (error) {
    console.error('Gmail API error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * SOLUTION 4: Supabase Edge Functions
 * Server-side email sending with user's SMTP
 */
export const sendEmailViaSupabaseFunction = async (emailData, userId) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-user-email', {
      body: {
        userId,
        emailData
      }
    });

    if (error) throw error;
    return { success: true, result: data };
  } catch (error) {
    console.error('Supabase function error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * SOLUTION 5: Hybrid Approach
 * Try multiple methods with fallback
 */
export const sendEmailWithFallback = async (emailData, userId) => {
  const businessSettings = await getUserBusinessSettings(userId);
  
  // Try user's preferred method first
  const preferredMethod = businessSettings.preferred_email_method || 'smtp';
  
  try {
    switch (preferredMethod) {
      case 'smtp':
        return await sendEmailViaSMTP(emailData, userId);
      case 'sendgrid':
        return await sendEmailViaSendGrid(emailData, userId);
      case 'mailgun':
        return await sendEmailViaMailgun(emailData, userId);
      case 'gmail':
        return await sendEmailViaGmailAPI(emailData, userId);
      default:
        throw new Error('No email method configured');
    }
  } catch (error) {
    console.log(`Primary method (${preferredMethod}) failed, trying fallback...`);
    
    // Fallback to EmailJS with user branding
    return await sendEmailViaEmailJS(emailData, userId);
  }
};

/**
 * Helper Functions
 */
const getUserBusinessSettings = async (userId) => {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

const getGmailAccessToken = async (userId) => {
  // Implementation depends on OAuth flow
  // Store Gmail refresh tokens in database
  // Return valid access token
};

/**
 * EMAIL DELIVERY COMPARISON:
 * 
 * 1. SMTP (Best for Professional):
 *    ✅ Emails sent from user's actual email
 *    ✅ Full control and authentication
 *    ❌ Requires backend server
 *    ❌ User needs SMTP credentials
 * 
 * 2. SendGrid/Mailgun (Best for Scale):
 *    ✅ Professional delivery
 *    ✅ High deliverability rates
 *    ✅ Analytics and tracking
 *    ❌ Monthly costs per user
 *    ❌ Requires API keys
 * 
 * 3. Gmail API (Best for Gmail Users):
 *    ✅ Sends from user's Gmail
 *    ✅ No additional costs
 *    ✅ High deliverability
 *    ❌ OAuth complexity
 *    ❌ Gmail-only solution
 * 
 * 4. EmailJS (Current - Fallback):
 *    ✅ Easy to implement
 *    ✅ No backend required
 *    ❌ Generic sender address
 *    ❌ Limited professional appearance
 * 
 * RECOMMENDATION:
 * Implement SMTP + Gmail API options for professional users
 * Keep EmailJS as fallback for basic users
 */