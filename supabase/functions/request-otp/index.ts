import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, purpose } = await req.json()

    if (!email || !purpose) {
      return new Response(JSON.stringify({ error: 'Email and purpose are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const serviceKey = (Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey
    )

    const normalizedEmail = String(email).toLowerCase().trim()

    // Password reset: only create OTP / send email if an auth user exists (saves Resend quota, reduces abuse)
    if (purpose === 'password_reset') {
      const { data: exists, error: existsErr } = await supabase.rpc('auth_email_exists', {
        p_email: normalizedEmail,
      })
      if (existsErr || !exists) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'If an account exists, an OTP has been sent.',
            debug_found: false // [DEBUG HINT]
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    // 1. Generate OTP via the internal RPC (Service Role)
    const { data, error: rpcError } = await supabase.rpc('internal_create_otp', {
      p_email: normalizedEmail,
      p_purpose: purpose,
    })

    if (rpcError) {
      if (rpcError.message.includes('Please wait') || rpcError.message.includes('Too many')) {
         return new Response(JSON.stringify({ error: rpcError.message }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, message: 'If an account exists, an OTP has been sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { otp_id, otp_code } = data[0]

    // 2. Send the email internally
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({
        type: 'otp',
        to: normalizedEmail,
        otp_code: otp_code,
        purpose: purpose,
        expires_in: '10 minutes'
      }),
    });
 
    if (!emailResponse.ok) {
        const errBody = await emailResponse.json().catch(() => ({}));
        console.error('Internal send-email failed for OTP:', emailResponse.status, errBody);
        throw new Error('Email delivery failed. Please try again later.');
    }
 
    console.log(`✅ OTP email sent successfully to: ${normalizedEmail}`);
    return new Response(JSON.stringify({ success: true, otpId: otp_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
