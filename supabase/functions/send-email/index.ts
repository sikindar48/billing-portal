import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { welcomeEmailHtml } from './templates/welcome.ts';
import { otpEmailHtml } from './templates/otp.ts';
import { subscriptionConfirmationHtml } from './templates/subscription.ts';
import { invoiceEmailHtml } from './templates/invoice.ts';

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

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

type AuthUser = { id: string; email?: string | null };

type AuthResult =
  | { ok: true; mode: 'service' }
  | { ok: true; mode: 'user'; user: AuthUser }
  | { ok: false; response: Response };

async function parseUserJwt(
  supabaseUrl: string,
  serviceKey: string,
  jwt: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await admin.auth.getUser(jwt);
  if (error || !user) return { user: null, error: error?.message ?? 'invalid' };
  return { user, error: null };
}

async function authorizeRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization') || '';
  const apiHeader = req.headers.get('apikey') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  // Use custom override if available, otherwise fallback to system key
  const serviceKey = (Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

  // Root Cause Fix: Allow internal calls that use either Bearer token OR apikey header as the service role key
  const isServiceKeyMatch = (token && token === serviceKey) || (apiHeader.trim() === serviceKey);
  
  if (isServiceKeyMatch) {
    return { ok: true, mode: 'service' };
  }

  if (!token) {
    return { ok: false, response: json({ error: 'Missing Authorization: Bearer <token>' }, 401) };
  }

  const { user, error } = await parseUserJwt(supabaseUrl, serviceKey, token);
  if (!user) {
    return { 
      ok: false, 
      response: json({ 
        error: 'Invalid or expired session', 
        details: error,
        debug: {
          token_len: token.length,
          expected_len: serviceKey.length,
          match: false
        }
      }, 401) 
    };
  }

  return { ok: true, mode: 'user', user };
}

async function assertRecipientAllowed(
  auth: Extract<AuthResult, { ok: true }>,
  body: Record<string, unknown>,
): Promise<Response | null> {
  if (auth.mode === 'service') return null;

  const user = auth.user;
  const type = body.type as string;
  const to = body.to as string | string[];
  const toList = Array.isArray(to) ? to : [to];
  const userEmail = normalizeEmail(user.email ?? '');

  if (type === 'otp') {
    return json({ error: 'OTP emails must be sent via the request-otp function' }, 403);
  }

  if (type === 'broadcast') {
    // Admin check is handled inside the broadcast block itself
    return null;
  }

  if (type === 'welcome' || type === 'subscription_confirmation') {
    if (!userEmail) {
      return json({ error: 'Your account has no email; cannot send this message' }, 403);
    }
    if (toList.length !== 1 || normalizeEmail(String(toList[0])) !== userEmail) {
      return json({ error: 'Recipient must be your own account email' }, 403);
    }
    return null;
  }

  if (type === 'invoice') {
    const invoiceNumber = body.invoice_number as string | undefined;
    if (!invoiceNumber) {
      return json({ error: 'Missing invoice_number' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: inv, error } = await db
      .from('invoices')
      .select('bill_to')
      .eq('user_id', user.id)
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();

    if (error || !inv) {
      return json({ error: 'Invoice not found' }, 404);
    }

    const billTo = inv.bill_to as Record<string, unknown> | null;
    const raw = billTo && typeof billTo.email === 'string' ? billTo.email : '';
    const custEmail = normalizeEmail(raw);
    if (!custEmail) {
      return json({ error: 'Invoice has no customer email on file' }, 400);
    }

    for (const addr of toList) {
      if (normalizeEmail(String(addr)) !== custEmail) {
        return json({ error: 'Recipient must match the invoice customer email' }, 403);
      }
    }
    return null;
  }

  return json({ error: `Email type not allowed: ${type}` }, 400);
}

async function recordResendSend(
  supabaseUrl: string,
  serviceKey: string,
  emailType: string,
  auth: Extract<AuthResult, { ok: true }>,
  resendId: string | undefined,
): Promise<void> {
  try {
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const userId = auth.mode === 'user' ? auth.user.id : null;
    const { error } = await db.from('platform_resend_email_events').insert({
      email_type: emailType,
      user_id: userId,
      resend_message_id: resendId ?? null,
    });
    if (error) console.warn('platform_resend_email_events:', error.message);
  } catch (e) {
    console.warn('recordResendSend:', (e as Error).message);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const auth = await authorizeRequest(req);
  if (!auth.ok) return auth.response;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not configured' }, 500);

  const type = body.type as string | undefined;
  const to = body.to as string | string[] | undefined;
  console.log(`send-email: type=${type} mode=${auth.mode}`);

  if (type === 'ping') {
    return json({ status: 'healthy', timestamp: new Date().toISOString() });
  }

  if (!type || (type !== 'broadcast' && type !== 'ping' && (to === undefined || to === null || (Array.isArray(to) && to.length === 0)))) {
    return json({ error: 'Missing required fields: type, to' }, 400);
  }

  const denied = await assertRecipientAllowed(auth, body);
  if (denied) return denied;

  const { attachment, invoice_number } = body as { attachment?: string; invoice_number?: string };

  let subject = '';
  let html = '';

  if (type === 'welcome') {
    const user_name = body.user_name as string | undefined;
    subject = 'Welcome to InvoicePort';
    html = welcomeEmailHtml(user_name ?? 'there');
  } else if (type === 'otp') {
    const otp_code = body.otp_code as string;
    const purpose = body.purpose as string | undefined;
    const expires_in = (body.expires_in as string | undefined) ?? '10 minutes';
    subject = purpose === 'password_reset' ? 'Reset your InvoicePort password' : 'Your InvoicePort verification code';
    html = otpEmailHtml(otp_code, expires_in);
  } else if (type === 'subscription_confirmation') {
    const { user_name, plan_name, amount, billing_cycle, period_end } = body as {
      user_name?: string;
      plan_name?: string;
      amount?: string | number;
      billing_cycle?: string;
      period_end?: string;
    };
    const amt =
      typeof amount === 'number' && Number.isFinite(amount)
        ? amount
        : Number(amount);
    const amountNum = Number.isFinite(amt) ? amt : 0;
    subject = `Subscription Confirmed: ${plan_name}`;
    html = subscriptionConfirmationHtml(
      user_name ?? 'there',
      plan_name ?? '',
      amountNum,
      billing_cycle ?? '',
      period_end ?? '',
    );
  } else if (type === 'invoice') {
    const { amount, currency, due_date, verify_url, user_name } = body as {
      amount?: string;
      currency?: string;
      due_date?: string;
      verify_url?: string;
      user_name?: string;
    };
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
      attachment,
    );
  } else if (type === 'broadcast') {
    const { target, subject: customSubject, message } = body as {
      target?: 'all' | 'pro' | 'free';
      subject?: string;
      message?: string;
    };

    if (!customSubject || !message) {
      return json({ error: 'Missing subject or message for broadcast' }, 400);
    }

    // BROADCAST IS SERVICE-ONLY OR ADMIN-USER ONLY
    if (auth.mode === 'user') {
      const sbUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const db = createClient(sbUrl, sbKey, { auth: { persistSession: false } });
      const { data: role } = await db.from('user_roles').select('role').eq('user_id', auth.user.id).eq('role', 'admin').maybeSingle();
      
      const adminEmails = (Deno.env.get('VITE_ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase());
      const isEmailAdmin = auth.user.email ? adminEmails.includes(auth.user.email.toLowerCase()) : false;

      if (!role && !isEmailAdmin) {
        return json({ error: 'Unauthorized: Admin access required for broadcasts' }, 403);
      }
    }

    // 1. Fetch target emails
    const sbUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const db = createClient(sbUrl, sbKey, { auth: { persistSession: false } });

    let query = db.from('profiles').select('id, email, full_name');
    
    if (target === 'pro') {
      const { data: proIds } = await db.from('user_subscriptions').select('user_id').gt('current_period_end', new Date().toISOString());
      const ids = (proIds || []).map(p => p.user_id);
      if (ids.length > 0) {
        query = query.in('id', ids);
      } else {
        // No pro users, return empty
        return json({ success: true, message: 'No recipients found for this target group' });
      }
    } else if (target === 'free') {
      const { data: proIds } = await db.from('user_subscriptions').select('user_id').gt('current_period_end', new Date().toISOString());
      const ids = (proIds || []).map(p => p.user_id);
      if (ids.length > 0) {
        query = query.not('id', 'in', `(${ids.join(',')})`);
      }
      // If no pro users, query remains unfiltered (all are free)
    }

    const { data: recipients, error: fetchErr } = await query;
    if (fetchErr) return json({ error: 'Failed to fetch recipients', details: fetchErr }, 500);
    if (!recipients || recipients.length === 0) return json({ success: true, message: 'No recipients found for this target group' });

    console.log(`🚀 Starting broadcast to ${recipients.length} users: "${customSubject}"`);

    // 2. Send emails asynchronously in background (don't await)
    // Return success immediately so the UI doesn't hang
    (async () => {
      const results = [];
      for (const person of recipients) {
        if (!person.email) continue;
        
        const personalizedHtml = `
          <div style="font-family: sans-serif; color: #374151; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">InvoicePort Announcement</h1>
            </div>
            <div style="padding: 32px; line-height: 1.6;">
              <p>Hello ${person.full_name || 'there'},</p>
              <div style="margin-top: 20px;">
                ${message.replace(/\{\{name\}\}/g, person.full_name || 'Customer')}
              </div>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 11px; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                Sent via InvoicePort Admin Command Center
              </p>
            </div>
          </div>
        `;

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'InvoicePort <info@invoiceport.live>',
              to: [person.email],
              subject: customSubject,
              html: personalizedHtml,
            }),
          });
          
          const r = await res.json();
          results.push(r.id);
          
          if (res.ok) {
            await recordResendSend(sbUrl, sbKey, 'broadcast', auth, r.id);
          }
        } catch (e) {
          console.error(`Failed to send to ${person.email}:`, e);
        }
        
        // Small delay to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      console.log(`✅ Broadcast complete: ${results.length} emails sent`);
    })();

    // Return success immediately without waiting for emails to send
    return json({ success: true, recipients: recipients.length, message: `Broadcast queued for ${recipients.length} users. Emails will be sent in the background.` });

  } else {
    return json({ error: `Unknown email type: ${type}` }, 400);
  }

  const resendPayload: Record<string, unknown> = {
    from: 'InvoicePort <info@invoiceport.live>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  if (type === 'invoice' && attachment) {
    const safeNumber = (invoice_number || 'Document').replace(/[^a-zA-Z0-9]/g, '_');
    console.log(`Attachment preamble: ${attachment.substring(0, 50)}...`);
    resendPayload.attachments = [
      {
        filename: `Invoice_${safeNumber}.pdf`,
        content: attachment,
      },
    ];
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
      suggestion: result.message?.includes('verified')
        ? 'Check if your sender domain is verified in Resend.'
        : 'Check your Resend API key and configuration.',
    }, resendRes.status);
  }

  const resendId = typeof result?.id === 'string' ? result.id : undefined;
  const sbUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (sbUrl && sbKey && type) {
    await recordResendSend(sbUrl, sbKey, type, auth, resendId);
  }

  return json({ success: true, id: result.id });
});
