import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { welcomeEmailHtml } from './templates/welcome.ts';
import { otpEmailHtml } from './templates/otp.ts';
import { subscriptionConfirmationHtml } from './templates/subscription.ts';
import { invoiceEmailHtml } from './templates/invoice.ts';
import type { EmailRequest } from './types.ts';

// ─── CORS ────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500);

    const body = await req.json() as any;
    const { type, to, attachment, invoice_number } = body;
    console.log(`Processing email: ${type} to: ${to}`);

    // Health Check Ping
    if (type === 'ping') {
      return json({ status: 'healthy', timestamp: new Date().toISOString() });
    }

    if (!type || !to) return json({ error: 'Missing required fields: type, to' }, 400);

    // ── Build subject + html per type ────────────────────────────────────
    let subject = '';
    let html = '';

    if (type === 'welcome') {
      const { user_name } = body;
      subject = 'Welcome to InvoicePort';
      html = welcomeEmailHtml(user_name ?? 'there');

    } else if (type === 'otp') {
      const { otp_code, purpose, expires_in } = body;
      subject = purpose === 'password_reset' ? 'Reset your InvoicePort password' : 'Your InvoicePort verification code';
      html = otpEmailHtml(otp_code, expires_in ?? '10 minutes');

    } else if (type === 'subscription_confirmation') {
      const { user_name, plan_name, amount, billing_cycle, period_end } = body;
      subject = `Subscription Confirmed: ${plan_name}`;
      html = subscriptionConfirmationHtml(
        user_name ?? 'there',
        plan_name,
        amount,
        billing_cycle ?? '',
        period_end,
      );

    } else if (type === 'invoice') {
      const { amount, currency, due_date, verify_url, user_name } = body;
      if (!invoice_number || !amount || !currency || !due_date || !verify_url) {
        return json({ error: 'Missing invoice fields' }, 400);
      }
      subject = `New Invoice #${invoice_number} from ${user_name || 'Service Provider'}`;
      html = invoiceEmailHtml(
        user_name ?? 'there',
        invoice_number,
        amount,
        currency,
        due_date,
        verify_url,
        attachment
      );

    } else {
      return json({ error: `Unknown email type: ${type}` }, 400);
    }

    // ── Send via Resend ───────────────────────────────────────────────────
    const resendPayload: any = {
      from: 'InvoicePort <info@invoiceport.live>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (type === 'invoice' && attachment) {
      // Sanitize filename: remove spaces and special chars
      const safeNumber = (invoice_number || 'Document').replace(/[^a-zA-Z0-9]/g, '_');
      
      // Log preamble to verify valid base64
      console.log(`Attachment preamble: ${attachment.substring(0, 50)}...`);
      
      resendPayload.attachments = [
        {
          filename: `Invoice_${safeNumber}.pdf`,
          content: attachment,
        }
      ];
      console.log(`PDF attachment added. Filename: Invoice_${safeNumber}.pdf`);
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const result = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend error response:', result);
      return json({ 
        error: result.message ?? 'Failed to send email via Resend', 
        details: result,
        suggestion: result.message?.includes('verified') ? 'Check if your sender domain is verified in Resend.' : 'Check your Resend API key and configuration.'
      }, resendRes.status);
    }

    return json({ success: true, id: result.id });

  } catch (err) {
    console.error('send-email error:', err);
    return json({ error: 'Internal server error', details: err.message }, 500);
  }
});
