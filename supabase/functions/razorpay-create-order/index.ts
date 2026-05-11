import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const rawServiceKey = Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const serviceKey = rawServiceKey.trim();

    // 2. Extract Token Safely
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', details: 'No Bearer token found in headers' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Initialize Authenticated Client (Native Verification)
    // This client uses the user's own token to verify them against Supabase Auth
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth check failed:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed', 
          details: authError?.message || 'Invalid session',
          hint: 'Your session may have expired. Please log out and log back in.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse Request Body
    const { planSlug, planPrice, planName } = await req.json();
    if (!planSlug || !planPrice) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: 'Missing plan details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Razorpay Configuration
    const rawKeyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const rawKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    
    // Root Cause Fix: Remove quotes and whitespace that often get included via CLI 'secrets set'
    const keyId = rawKeyId.trim().replace(/^["']|["']$/g, '');
    const keySecret = rawKeySecret.trim().replace(/^["']|["']$/g, '');

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: 'Configuration error', details: 'Razorpay keys not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Diagnostic log (Masked)
    console.log(`🔑 Using Key ID: ${keyId.slice(0, 8)}...${keyId.slice(-4)}`);
    console.log(`🔑 Key Secret Length: ${keySecret.length}, Masked: ${keySecret.slice(0, 3)}...${keySecret.slice(-3)}`);

    // 6. Create Razorpay Order
    // Bulletproof Basic Auth encoding for Deno
    const tokenStr = `${keyId}:${keySecret}`;
    const credentials = btoa(tokenStr);
    
    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now().toString().slice(-6)}`;
    
    console.log(`📡 Sending request to Razorpay for user: ${user.id}`);
    console.log(`📡 Auth Header: Basic ${credentials.slice(0, 10)}...`);
    
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(planPrice * 100), // Ensure integer paise
        currency: 'INR',
        receipt,
        notes: { userId: user.id, planSlug }
      }),
    });

    const order = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('🚨 RAZORPAY ERROR CODE:', order.error?.code);
      console.error('🚨 RAZORPAY ERROR DESC:', order.error?.description);
      return new Response(
        JSON.stringify({ 
          error: 'Payment gateway error', 
          details: order.error?.description || order.error?.reason || 'Authentication failed',
          code: order.error?.code,
          raw: order 
        }),
        { status: rzpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Store Order (Elevated Privileges)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    await supabaseAdmin.from('payment_orders').insert({
      order_id: order.id,
      user_id: user.id,
      plan_slug: planSlug,
      amount: planPrice,
      status: 'created',
      receipt
    });

    // 8. Success Response
    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Critical Function Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
