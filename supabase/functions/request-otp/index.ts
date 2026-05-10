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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Generate OTP via the internal RPC (Service Role)
    const { data, error: rpcError } = await supabase.rpc('internal_create_otp', {
      p_email: email,
      p_purpose: purpose,
    })

    if (rpcError) {
      // Security Fix: Prevent email enumeration
      // If no account is found for a password reset, we return "success" but don't send anything.
      if (rpcError.message.includes('Please wait') || rpcError.message.includes('Too many')) {
         return new Response(JSON.stringify({ error: rpcError.message }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // For any other error (likely "user not found"), we pretend it succeeded
      return new Response(JSON.stringify({ success: true, message: 'If an account exists, an OTP has been sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { otp_id, otp_code } = data[0]

    // 2. Send the email using the existing send-email logic or direct Resend call
    // We'll call the existing send-email function internally to reuse the template
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        type: 'otp',
        to: email,
        otp_code: otp_code,
        purpose: purpose,
        expires_in: '10 minutes'
      }),
    })

    if (!emailResponse.ok) {
        throw new Error('Failed to send OTP email')
    }

    return new Response(JSON.stringify({ success: true, otpId: otp_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
