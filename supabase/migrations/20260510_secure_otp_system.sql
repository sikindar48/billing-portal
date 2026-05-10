-- Secure the OTP verification system [Fix for C-08]

-- 1. Ensure the table exists
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lock down the table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.otp_verifications;
DROP POLICY IF EXISTS "Enable read for everyone" ON public.otp_verifications;
DROP POLICY IF EXISTS "Enable update for everyone" ON public.otp_verifications;

-- 3. Internal function to generate OTP (Service Role Only)
CREATE OR REPLACE FUNCTION public.internal_create_otp(p_email TEXT, p_purpose TEXT)
RETURNS TABLE (otp_id UUID, otp_code TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_otp_code TEXT;
    v_otp_id UUID;
BEGIN
    -- Rate limit: 1 OTP per minute per email/purpose
    IF EXISTS (
        SELECT 1 FROM public.otp_verifications 
        WHERE email = LOWER(TRIM(p_email))
        AND purpose = p_purpose 
        AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
        RAISE EXCEPTION 'Please wait 60 seconds before requesting a new code.';
    END IF;

    v_otp_code := floor(random() * 900000 + 100000)::text;

    INSERT INTO public.otp_verifications (email, otp_code, purpose, expires_at)
    VALUES (LOWER(TRIM(p_email)), v_otp_code, p_purpose, NOW() + INTERVAL '10 minutes')
    RETURNING id INTO v_otp_id;

    RETURN QUERY SELECT v_otp_id, v_otp_code;
END;
$$;

-- 4. Public function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp_securely(p_email TEXT, p_otp_code TEXT, p_purpose TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT * INTO v_record
    FROM public.otp_verifications
    WHERE email = LOWER(TRIM(p_email))
      AND purpose = p_purpose
      AND verified = false
      AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1;

    IF v_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code.');
    END IF;

    IF v_record.attempts >= v_record.max_attempts THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many attempts. Request a new code.');
    END IF;

    IF v_record.otp_code = p_otp_code THEN
        UPDATE public.otp_verifications SET verified = true, verified_at = NOW() WHERE id = v_record.id;
        RETURN jsonb_build_object('success', true);
    ELSE
        UPDATE public.otp_verifications SET attempts = attempts + 1 WHERE id = v_record.id;
        RETURN jsonb_build_object('success', false, 'error', 'Incorrect code.');
    END IF;
END;
$$;

-- 5. Permissions
REVOKE ALL ON FUNCTION public.internal_create_otp(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.internal_create_otp(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_otp_securely(TEXT, TEXT, TEXT) TO anon, authenticated;
