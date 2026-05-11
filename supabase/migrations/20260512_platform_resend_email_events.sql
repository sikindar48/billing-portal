-- Platform-wide Resend usage (transactional mail: welcome, OTP, subscription, invoice via Resend).
-- Used for admin dashboard vs monthly plan limit (e.g. 3000/month on Resend free tier).

CREATE TABLE IF NOT EXISTS public.platform_resend_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resend_message_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_platform_resend_events_created_at
  ON public.platform_resend_email_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_resend_events_type
  ON public.platform_resend_email_events (email_type);

ALTER TABLE public.platform_resend_email_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.platform_resend_email_events IS 'One row per successful Resend API send from send-email Edge Function; admin-only reads via RPC.';

-- No direct SELECT for authenticated users (only service_role inserts from Edge Functions; admin via RPC)

CREATE OR REPLACE FUNCTION public.get_admin_resend_email_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_start timestamptz := date_trunc('month', now());
  m_end timestamptz := m_start + interval '1 month';
  lim int := 3000;
  total bigint;
  by_type jsonb;
  recent jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  SELECT count(*) INTO total
  FROM public.platform_resend_email_events
  WHERE created_at >= m_start AND created_at < m_end;

  SELECT coalesce(jsonb_object_agg(email_type, c), '{}'::jsonb) INTO by_type
  FROM (
    SELECT email_type, count(*)::bigint AS c
    FROM public.platform_resend_email_events
    WHERE created_at >= m_start AND created_at < m_end
    GROUP BY email_type
  ) s;

  SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO recent
  FROM (
    SELECT id, created_at, email_type, user_id, resend_message_id
    FROM public.platform_resend_email_events
    ORDER BY created_at DESC
    LIMIT 50
  ) t;

  RETURN jsonb_build_object(
    'month_start_utc', m_start,
    'month_end_utc', m_end,
    'monthly_limit', lim,
    'total_this_month', total,
    'remaining_approx', greatest(0::bigint, lim::bigint - coalesce(total, 0)),
    'by_type', by_type,
    'last_50', recent
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_resend_email_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_resend_email_stats() TO authenticated;
