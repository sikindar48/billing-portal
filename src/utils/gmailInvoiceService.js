// Gmail Invoice Service - Send invoices from user's Gmail account
import { supabase } from '@/integrations/supabase/client';

// Gmail OAuth Configuration
const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;

/** Escape text for HTML body (H-03: invoice fields are user-controlled). */
function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip control chars from RFC 2822 headers (injection via newline). */
function sanitizeEmailHeader(value) {
  return String(value ?? '').replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim().slice(0, 998);
}



/**
 * Get user's business settings for email branding
 */
const getUserBusinessSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('branding_settings')
      .select('metadata, company_name, logo_url, website')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return {
        company_name: 'My Business',
        company_email: null,
        company_phone: null,
        company_website: null,
        address_line1: null,
        preferred_email_method: 'default_mail'
      };
    }

    const meta = data.metadata || {};
    return {
      company_name: data.company_name || meta.company_name || 'My Business',
      company_email: meta.email || null,
      company_phone: meta.phone || null,
      company_website: data.website || meta.website || null,
      address_line1: meta.address || null,
      preferred_email_method: meta.preferred_email_method || 'default_mail',
      email_signature: meta.email_signature || '',
    };
  } catch (error) {
    console.error('Error in getUserBusinessSettings:', error);
    return null;
  }
};

/**
 * Check if Gmail is connected and available for user
 */
export const isGmailConnected = async (userId) => {
  try {
    const { data: settings, error } = await supabase
      .from('branding_settings')
      .select('metadata')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !settings?.metadata) {
      return false;
    }

    const meta = settings.metadata;
    return !!(meta.gmail_refresh_token && meta.preferred_email_method === 'gmail');
  } catch (error) {
    return false;
  }
};

/**
 * Send invoice via Gmail - Improved implementation
 */
export const sendInvoiceViaGmail = async (invoiceData, userId) => {
  try {
    // Check if Gmail is connected first
    const gmailConnected = await isGmailConnected(userId);
    if (!gmailConnected) {
      throw new Error('Gmail not connected. Please connect your Gmail account in Business Settings first.');
    }

    // Validate customer email
    if (!invoiceData.billTo?.email) {
      throw new Error('Customer email is required to send invoice');
    }

    // Get business settings and Gmail tokens
    const { data: settings, error } = await supabase
      .from('branding_settings')
      .select('metadata, company_name, logo_url, website')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !settings?.metadata?.gmail_refresh_token) {
      throw new Error('Gmail not properly configured. Please reconnect your Gmail account.');
    }

    const meta = settings.metadata;

    // Get fresh access token
    const accessToken = await refreshGmailAccessToken(meta.gmail_refresh_token);
    if (!accessToken) {
      throw new Error('Failed to refresh Gmail access token. Please reconnect your Gmail account.');
    }

    // Build a settings-like object for email content generation
    const businessSettings = {
      company_name: settings.company_name || meta.company_name || 'My Business',
      company_email: meta.email || '',
      company_phone: meta.phone || '',
      company_website: settings.website || meta.website || '',
      address_line1: meta.address || '',
      gmail_email: meta.gmail_email,
      preferred_email_method: meta.preferred_email_method,
      email_signature: meta.email_signature || '',
    };

    // Prepare email content
    const emailContent = createInvoiceEmailContent(invoiceData, businessSettings);
    
    // Send email via Gmail API
    const result = await sendGmailMessage(accessToken, emailContent);
    
    return {
      success: true,
      result,
      method: 'gmail',
      sentTo: invoiceData.billTo.email,
      sentFrom: businessSettings.gmail_email || businessSettings.company_email
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: 'gmail'
    };
  }
};

/**
 * Refresh Gmail access token using secure Edge Function
 */
const refreshGmailAccessToken = async (refreshToken) => {
  try {
    const { data, error } = await supabase.functions.invoke('gmail-token-refresh', {
      body: { refresh_token: refreshToken }
    });

    if (error || data?.error) {
      throw new Error(data?.error || 'Token refresh failed');
    }

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Gmail access token:', error);
    return null;
  }
};

/**
 * Create email content for invoice
 */
const createInvoiceEmailContent = (invoiceData, businessSettings) => {
  const currencySymbol = invoiceData.selectedCurrency === 'INR' ? '₹' : '$';

  const invNum = escapeHtml(invoiceData.invoice?.number ?? '');
  const company = escapeHtml(businessSettings.company_name || 'My Business');
  const billName = escapeHtml(invoiceData.billTo?.name || 'Customer');
  const billEmail = escapeHtml(invoiceData.billTo?.email || '');
  const billAddr = escapeHtml(invoiceData.billTo?.address || '');
  const billPhone = escapeHtml(invoiceData.billTo?.phone || '');
  const fromEmail = escapeHtml(businessSettings.company_email || '');
  const fromPhone = escapeHtml(businessSettings.company_phone || '');
  const fromWeb = escapeHtml(businessSettings.company_website || '');
  const invDate = escapeHtml(new Date(invoiceData.invoice.date).toLocaleDateString());
  const dueDate = escapeHtml(new Date(invoiceData.invoice.paymentDate).toLocaleDateString());
  const subTotal = escapeHtml(String(invoiceData.subTotal ?? 0));
  const taxAmt = escapeHtml(String(invoiceData.taxAmount ?? 0));
  const grandTotal = escapeHtml(String(invoiceData.grandTotal ?? 0));
  const notesHtml = invoiceData.notes
    ? escapeHtml(invoiceData.notes).replace(/\n/g, '<br>')
    : '';
  const sigRaw = businessSettings.email_signature?.trim();
  const signatureHtml = sigRaw
    ? escapeHtml(sigRaw).replace(/\n/g, '<br>')
    : `Best regards,<br>${company}`;

  const itemsList = invoiceData.items?.map(item => {
    const desc = escapeHtml(item.description || item.name || '');
    const qty = escapeHtml(String(item.quantity ?? ''));
    const rate = escapeHtml(String(item.amount ?? ''));
    const rawLineTotal =
      item.total != null && item.total !== ''
        ? item.total
        : Number(item.quantity) * Number(item.amount);
    const lineTotal = escapeHtml(
      Number.isFinite(Number(rawLineTotal)) ? String(rawLineTotal) : '0'
    );
    return `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${desc}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${rate}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${lineTotal}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666;">No items</td></tr>';

  const subject = sanitizeEmailHeader(`Invoice ${invoiceData.invoice?.number ?? ''} from ${businessSettings.company_name || 'My Business'}`);
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invNum}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Invoice from ${company}</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Invoice #${invNum}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <!-- Invoice Details -->
            <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <h3 style="font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Invoice Details</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                    <span style="color: #666; font-weight: 500;">Invoice Date</span>
                    <span style="color: #333; font-weight: 600;">${invDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                    <span style="color: #666; font-weight: 500;">Due Date</span>
                    <span style="color: #333; font-weight: 600;">${dueDate}</span>
                </div>
            </div>

            <!-- Billing Information -->
            <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <h3 style="font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Billing Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="font-size: 12px; font-weight: 600; color: #2563eb; text-transform: uppercase; margin: 0 0 8px 0;">Bill To</h4>
                        <div style="font-weight: 600; font-size: 16px; color: #1e293b; margin-bottom: 8px;">${billName}</div>
                        <div style="color: #475569; font-size: 14px;">
                            ${billEmail}<br>
                            ${billAddr}<br>
                            ${billPhone}
                        </div>
                    </div>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="font-size: 12px; font-weight: 600; color: #2563eb; text-transform: uppercase; margin: 0 0 8px 0;">From</h4>
                        <div style="font-weight: 600; font-size: 16px; color: #1e293b; margin-bottom: 8px;">${company}</div>
                        <div style="color: #475569; font-size: 14px;">
                            ${fromEmail}<br>
                            ${fromPhone ? `${fromPhone}<br>` : ''}
                            ${fromWeb}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Items -->
            <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <h3 style="font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Items & Services</h3>
                <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Description</th>
                            <th style="color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
                            <th style="color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Rate</th>
                            <th style="color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div style="margin-bottom: 25px;">
                <div style="background: #f1f5ff; border: 1px solid #c7d2fe; padding: 20px; border-radius: 10px; max-width: 300px; margin-left: auto;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px;">
                        <span style="color: #64748b; font-weight: 500;">Subtotal</span>
                        <span style="color: #1e293b; font-weight: 600;">${currencySymbol}${subTotal}</span>
                    </div>
                    ${invoiceData.taxAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px;">
                        <span style="color: #64748b; font-weight: 500;">Tax</span>
                        <span style="color: #1e293b; font-weight: 600;">${currencySymbol}${taxAmt}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #1e40af; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2563eb;">
                        <span>Total Amount</span>
                        <span>${currencySymbol}${grandTotal}</span>
                    </div>
                </div>
            </div>

            ${invoiceData.notes ? `
            <!-- Notes -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Notes</h3>
                <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0;">
                    <div style="color: #475569; margin: 0;">${notesHtml}</div>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #1e293b; color: #94a3b8; padding: 25px; text-align: center; font-size: 13px;">
            <div style="color: #ffffff; font-weight: 600; margin-bottom: 8px;">${company}</div>
            <div style="margin-bottom: 15px;">
                ${fromEmail}
                ${fromPhone && fromEmail ? ' • ' : ''}
                ${fromPhone}
            </div>
            <div style="opacity: 0.7; font-size: 12px;">
                ${signatureHtml}<br>
                © ${new Date().getFullYear()} • Powered by InvoicePort
            </div>
        </div>
    </div>
</body>
</html>`;

  return {
    to: sanitizeEmailHeader(invoiceData.billTo.email),
    subject,
    body: htmlBody,
    isHtml: true
  };
};

/**
 * Send email via Gmail API
 */
const sendGmailMessage = async (accessToken, emailContent) => {
  try {
    // Create email message in proper RFC 2822 format with HTML support
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let message;
    
    if (emailContent.isHtml) {
      // HTML email with multipart structure
      message = [
        `To: ${emailContent.to}`,
        `Subject: ${emailContent.subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        emailContent.body,
        '',
        `--${boundary}--`
      ].join('\r\n');
    } else {
      // Plain text email
      message = [
        `To: ${emailContent.to}`,
        `Subject: ${emailContent.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        emailContent.body
      ].join('\r\n');
    }

    // Encode message in base64url format (Gmail API requirement)
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gmail API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Gmail message:', error);
    throw error;
  }
};