-- Used by request-otp Edge Function (service_role only) to avoid Resend sends for unknown emails.
-- Does not grant access to auth.users to authenticated clients.

CREATE OR REPLACE FUNCTION public.auth_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(btrim(email::text)) = lower(btrim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_email_exists(text) TO service_role;

COMMENT ON FUNCTION public.auth_email_exists(text) IS 'Returns whether an auth user exists for the email; service_role only (OTP / quota control).';
