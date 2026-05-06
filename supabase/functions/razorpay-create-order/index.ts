import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    const { planSlug, planPrice, planName } = await req.json();

    if (!planSlug || !planPrice || !planName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planSlug, planPrice, planName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan price (security check - ensure frontend isn't manipulating prices)
    const validPlans = {
      'monthly': 149,
      'yearly': 1499,
    };

    if (validPlans[planSlug] !== planPrice) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan price' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Razorpay credentials
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const credentials = btoa(`${keyId}:${keySecret}`);

    // Create Razorpay order
    // Receipt must be max 40 characters - use short format
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const userIdShort = user.id.slice(0, 8); // First 8 chars of user ID
    const receipt = `ord_${userIdShort}_${timestamp}`; // Format: ord_12345678_12345678 (max 27 chars)
    
    console.log('📝 Creating order with receipt:', receipt, 'length:', receipt.length);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: planPrice * 100, // Razorpay expects paise
        currency: 'INR',
        receipt,
        notes: {
          userId: user.id,
          userEmail: user.email,
          planSlug,
          planName,
        },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      console.error('Razorpay order creation failed:', order);
      return new Response(
        JSON.stringify({ error: order.error?.description || 'Failed to create order' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Razorpay order created:', { orderId: order.id, userId: user.id, planSlug });

    // Store order in database for verification later
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: user.id,
        plan_slug: planSlug,
        amount: planPrice,
        currency: 'INR',
        status: 'created',
        receipt,
      });

    if (dbError) {
      console.error('Failed to store order in DB:', dbError);
      // Don't fail the request - order is already created in Razorpay
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
