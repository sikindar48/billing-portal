import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token (optional security check)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, planSlug, paymentId, planPrice, planName } = await req.json();

    // Validate required fields
    if (!userId || !planSlug || !paymentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, planSlug, paymentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user making the request matches the userId
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Starting subscription activation...', { userId, planSlug, paymentId });

    // Map plan slugs to database IDs
    const planIdMap = { 
      monthly: 2, 
      yearly: 3, 
      trial: 1 
    };
    const dbPlanId = planIdMap[planSlug] ?? 1;

    // Calculate subscription period dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (planSlug === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planSlug === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    // For trial, keep same dates (no extension)

    // Prepare subscription payload
    const subscriptionPayload = {
      user_id: userId,
      plan_id: dbPlanId,
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Use upsert to handle both new and existing subscriptions
    const { data: subscriptionData, error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionPayload, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select('id,plan_id,status,current_period_start,current_period_end,updated_at')
      .single();

    if (upsertError) {
      console.error('Subscription upsert failed:', upsertError);
      return new Response(
        JSON.stringify({ error: `Subscription activation failed: ${upsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Subscription activated successfully:', subscriptionData);

    // Log the payment for admin tracking
    const logMessage = `Razorpay payment ${paymentId} for ${planName} (₹${planPrice})`;
    
    const { error: logError } = await supabase
      .from('subscription_requests')
      .insert({
        user_id: userId,
        plan_id: dbPlanId,
        message: logMessage,
        status: 'approved',
      });

    if (logError) {
      console.warn('Payment logging failed (non-critical):', logError);
      // Don't fail the entire operation for logging issues
    } else {
      console.log('✅ Payment logged successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: subscriptionData,
        message: 'Subscription activated successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});