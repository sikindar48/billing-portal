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
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Try direct getUserByEmail (most efficient)
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserByEmail(normalizedEmail);
    if (userData?.user) {
      return userData.user;
    }

    // 2. Fallback: Check business_settings table in public schema
    // This table mirrors user emails and can be queried if listUsers/getUserByEmail has issues
    const { data: profileData, error: profileError } = await adminClient
      .from('business_settings')
      .select('user_id')
      .eq('company_email', normalizedEmail)
      .maybeSingle();

    if (profileData?.user_id) {
      // If found in business_settings, get the full user object
      const { data: finalUserData } = await adminClient.auth.admin.getUserById(profileData.user_id);
      if (finalUserData?.user) return finalUserData.user;
    }

    // 3. Last resort: List users (slow but thorough)
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data || !data.users) break;
      
      const user = data.users.find((u: any) => u.email?.toLowerCase().trim() === normalizedEmail);
      if (user) return user;
      
      hasMore = data.users.length === 1000;
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = (Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

    if (!SUPABASE_URL || !serviceKey) {
      return json({ error: 'Server configuration error' }, 500);
    }

    const adminClient = createClient(SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
