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
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: json({ error: 'Missing Authorization: Bearer <token>' }, 401) };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { ok: false, response: json({ error: 'Empty bearer token' }, 401) };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, response: json({ error: 'Server configuration missing' }, 500) };
  }

  if (token === serviceKey) {
    return { ok: true, mode: 'service' };
  }

  const { user, error } = await parseUserJwt(supabaseUrl, serviceKey, token);
  if (!user) {
    return { ok: false, response: json({ error: 'Invalid or expired session', details: error }, 401) };
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

  if (!type || to === undefined || to === null || (Array.isArray(to) && to.length === 0)) {
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
    subject = `Subscription Confirmed: ${plan_name}`;
    html = subscriptionConfirmationHtml(
      user_name ?? 'there',
      plan_name ?? '',
      amount,
      billing_cycle ?? '',
      period_end,
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

  return json({ success: true, id: result.id });
});
