import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC-SHA256 via native Web Crypto — no external imports, always works in Deno
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const rzpSecret   = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!supabaseUrl || !serviceKey || !rzpSecret) {
      console.error('Missing env vars');
      return json({ error: 'Server configuration missing' }, 500);
    }

    const db = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await db.auth.getUser(token);
    if (authErr || !user) {
      console.error('Auth failed:', authErr?.message);
      return json({ error: 'Invalid or expired token' }, 401);
    }

    console.log('Authenticated user:', user.id);

    // ── 2. Parse body ─────────────────────────────────────────────────────
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planSlug,
      planName,
      planPrice,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planSlug) {
      return json({ error: 'Missing required fields' }, 400);
    }

    console.log('Verifying payment:', { orderId: razorpay_order_id, paymentId: razorpay_payment_id, planSlug });

    // ── 3. Verify Razorpay HMAC signature ─────────────────────────────────
    const sigOk = await verifyRazorpaySignature(
      razorpay_order_id, razorpay_payment_id, razorpay_signature, rzpSecret,
    );

    if (!sigOk) {
      console.error('Signature mismatch — possible tampered payment');
      await db.from('payment_orders').update({
        status: 'signature_failed',
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      }).eq('order_id', razorpay_order_id);
      return json({ error: 'Payment signature verification failed' }, 400);
    }

    console.log('Signature verified OK');

    // ── 4. Check order in DB ──────────────────────────────────────────────
    const { data: order, error: orderErr } = await db
      .from('payment_orders')
      .select('id, status, plan_slug, user_id')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orderErr) {
      console.error('Order lookup error:', orderErr.message);
      // Don't block — signature was valid, proceed
    }

    if (order?.status === 'completed') {
      console.log('Order already completed — idempotent return');
      return json({ success: true, message: 'Payment already processed' });
    }

    if (order && order.plan_slug !== planSlug) {
      return json({ error: 'Plan mismatch between order and request' }, 400);
    }

    // ── 5. Activate subscription via SECURITY DEFINER RPC ─────────────────
    // This bypasses RLS entirely and handles both INSERT and UPDATE
    const planIdMap: Record<string, number> = { monthly: 2, yearly: 3, trial: 1 };
    const planId = planIdMap[planSlug] ?? 2;

    const now = new Date();
    const end = new Date(now);
    if (planSlug === 'monthly') end.setMonth(end.getMonth() + 1);
    else if (planSlug === 'yearly') end.setFullYear(end.getFullYear() + 1);

    console.log('Calling activate_subscription_after_payment RPC:', { userId: user.id, planId, end: end.toISOString() });

    const { data: rpcResult, error: rpcErr } = await db.rpc('activate_subscription_after_payment', {
      p_user_id:   user.id,
      p_plan_slug: planSlug,
      p_plan_id:   planId,
      p_period_end: end.toISOString(),
    });

    if (rpcErr) {
      console.error('RPC activation failed:', rpcErr.message, rpcErr.code, rpcErr.details);
      return json({ error: `Subscription activation failed: ${rpcErr.message}` }, 500);
    }

    console.log('Subscription activated via RPC:', rpcResult);

    // ── 5b. Subscription confirmation email (Resend via send-email, service role)
    // So the user gets mail even if the browser drops the HTTP response after activation.
    const userEmail = user.email?.trim();
    if (userEmail) {
      const billingCycle = planSlug === 'monthly' ? 'Monthly' : 'Yearly';
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const fullName = typeof meta?.full_name === 'string' ? meta.full_name : '';
      const displayName = fullName || userEmail;
      const amountNum =
        typeof planPrice === 'number' && !Number.isNaN(planPrice)
          ? planPrice
          : Number(planPrice);
      const amountSafe = Number.isFinite(amountNum) ? amountNum : 0;

      const emailCtrl = new AbortController();
      const emailTimer = setTimeout(() => emailCtrl.abort(), 18_000);
      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          signal: emailCtrl.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
          },
          body: JSON.stringify({
            type: 'subscription_confirmation',
            to: userEmail,
            user_name: displayName,
            plan_name: planName ?? planSlug,
            amount: amountSafe,
            billing_cycle: billingCycle,
            period_end: end.toISOString(),
          }),
        });
        if (!emailRes.ok) {
          const errBody = await emailRes.json().catch(() => ({}));
          console.warn('send-email subscription_confirmation failed:', emailRes.status, errBody);
        }
      } catch (e) {
        console.warn('send-email subscription_confirmation error (non-blocking):', (e as Error).message);
      } finally {
        clearTimeout(emailTimer);
      }
    } else {
      console.warn('No user email on JWT; skipping subscription confirmation email');
    }

    // ── 6. Mark order as completed ────────────────────────────────────────
    if (order?.id) {
      const { error: updErr } = await db.from('payment_orders').update({
        status: 'completed',
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      }).eq('order_id', razorpay_order_id);

      if (updErr) console.warn('Failed to mark order completed (non-critical):', updErr.message);
    }

    // ── 7. Audit log (non-critical) ───────────────────────────────────────
    await db.from('subscription_requests').insert({
      user_id: user.id,
      plan_id: planId,
      message: `Razorpay ${razorpay_payment_id} | ${planName ?? planSlug} | ₹${planPrice ?? ''}`,
      status: 'approved',
    }).then(({ error: e }) => {
      if (e) console.warn('Audit log failed (non-critical):', e.message);
    });

    console.log('Done — subscription activated for user:', user.id);

    return json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: rpcResult,
    });

  } catch (err) {
    console.error('Unhandled exception:', err);
    return json({ error: (err as Error).message ?? 'Internal server error' }, 500);
  }
});
