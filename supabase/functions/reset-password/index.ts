import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Looks up a user by email using the Supabase Admin client
async function findUserByEmail(adminClient: any, email: string) {
  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 50 });
      if (error || !data || !data.users) {
        console.error("Error listing users:", error);
        return null;
      }
      const user = data.users.find((u: { email: string }) => u.email?.toLowerCase() === email);
      if (user) return user;
      
      hasMore = data.users.length === 50;
      page++;
    }
    return null;
  } catch (err) {
    console.error("findUserByEmail error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ error: 'Server configuration error' }, 500);
    }

    const body = await req.json();
    const { action, email } = body;

    if (!action) {
      return json({ error: 'Missing action. Use "check" or "reset".' }, 400);
    }

    // ── Action: check — validate email exists before sending OTP ─────────
    if (action === 'check') {
      if (!email) {
        return json({ error: 'Missing email' }, 400);
      }
      const normalizedEmail = email.toLowerCase().trim();
      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const user = await findUserByEmail(adminClient, normalizedEmail);
      if (!user) {
        return json({ exists: false, error: 'No account found with this email address.' }, 404);
      }
      return json({ exists: true });
    }

    // ── Action: reset — update password after OTP verified ───────────────
    if (action === 'reset') {
      const { new_password, otp_id } = body;
      const normalizedEmail = email?.toLowerCase().trim();

      if (!normalizedEmail || !new_password || !otp_id) {
        return json({ error: 'Missing required fields: email, new_password, otp_id' }, 400);
      }
      if (new_password.length < 6) {
        return json({ error: 'Password must be at least 6 characters' }, 400);
      }

      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Verify the OTP record
      const { data: otpRecord, error: otpError } = await adminClient
        .from('otp_verifications')
        .select('id, email, verified, purpose, verified_at')
        .eq('id', otp_id)
        .eq('email', normalizedEmail)
        .eq('purpose', 'password_reset')
        .eq('verified', true)
        .single();

      if (otpError || !otpRecord) {
        return json({ error: 'Invalid or unverified OTP. Please start over.' }, 403);
      }

      // OTP must have been verified within the last 15 minutes
      const verifiedAt = new Date(otpRecord.verified_at).getTime();
      if (Date.now() - verifiedAt > 15 * 60 * 1000) {
        return json({ error: 'OTP session expired. Please request a new code.' }, 403);
      }

      // Find the user
      const user = await findUserByEmail(adminClient, normalizedEmail);
      if (!user) {
        return json({ error: 'No account found for this email address.' }, 404);
      }

      // Update the password
      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        password: new_password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return json({ error: 'Failed to update password. Please try again.' }, 500);
      }

      // Invalidate the OTP so it can't be reused
      await adminClient
        .from('otp_verifications')
        .delete()
        .eq('id', otp_id);

      return json({ success: true });
    }

    return json({ error: 'Unknown action. Use "check" or "reset".' }, 400);

  } catch (err) {
    console.error('reset-password error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
