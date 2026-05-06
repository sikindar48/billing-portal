import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { welcomeEmailHtml }            from './templates/welcome';
import { otpEmailHtml }                from './templates/otp';
import { subscriptionConfirmationHtml } from './templates/subscription';
import type { EmailRequest }           from './types';

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

    const body = await req.json() as EmailRequest;
    const { type, to } = body;

    if (!type || !to) return json({ error: 'Missing required fields: type, to' }, 400);

    // ── Build subject + html per type ────────────────────────────────────
    let subject = '';
    let html    = '';

    if (type === 'welcome') {
      subject = "🎉 Welcome to InvoicePort – Let's Get Started!";
      html    = welcomeEmailHtml(body.user_name ?? '');

    } else if (type === 'otp') {
      if (!body.otp_code) return json({ error: 'Missing otp_code' }, 400);
      subject = `${body.otp_code} is your InvoicePort Password Reset code`;
      html    = otpEmailHtml(body.otp_code, body.expires_in ?? '10 minutes');

    } else if (type === 'subscription_confirmation') {
      const { plan_name, amount, period_end } = body;
      if (!plan_name || !amount || !period_end) {
        return json({ error: 'Missing fields: plan_name, amount, period_end' }, 400);
      }
      subject = `🎉 You're on ${plan_name} – InvoicePort`;
      html    = subscriptionConfirmationHtml(
        body.user_name ?? '',
        plan_name,
        amount,
        body.billing_cycle ?? '',
        period_end,
      );

    } else {
      return json({ error: `Unknown email type: ${type}` }, 400);
    }

    // ── Send via Resend ───────────────────────────────────────────────────
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'InvoicePort <info@invoiceport.live>',
        to:   Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const result = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend error:', result);
      return json({ error: result.message ?? 'Failed to send email', details: result }, resendRes.status);
    }

    return json({ success: true, id: result.id });

  } catch (err) {
    console.error('send-email error:', err);
    return json({ error: 'Internal server error', details: err.message }, 500);
  }
});
