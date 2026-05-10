-- RPC function to activate a subscription after payment
-- Runs as SECURITY DEFINER so it bypasses RLS completely
-- Called by the verify-payment-and-activate edge function

CREATE OR REPLACE FUNCTION public.activate_subscription_after_payment(
  p_user_id UUID,
  p_plan_slug TEXT,
  p_plan_id INTEGER,
  p_period_end TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_result JSONB;
BEGIN
  -- Check if subscription row exists
  SELECT id INTO v_existing_id
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- UPDATE existing row
    UPDATE public.user_subscriptions
    SET
      plan_id             = p_plan_id,
      status              = 'active',
      current_period_start = NOW(),
      current_period_end  = p_period_end,
      email_limit         = 999999,
      updated_at          = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- INSERT new row
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      email_limit
    ) VALUES (
      p_user_id,
      p_plan_id,
      'active',
      NOW(),
      p_period_end,
      999999
    );
  END IF;

  -- Return the updated row
  SELECT jsonb_build_object(
    'plan_id',             plan_id,
    'status',              status,
    'current_period_start', current_period_start,
    'current_period_end',  current_period_end,
    'email_limit',         email_limit
  ) INTO v_result
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- Grant execute to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.activate_subscription_after_payment(UUID, TEXT, INTEGER, TIMESTAMPTZ)
  TO service_role;

-- REVOKED: TO authenticated (Security Fix C-01)
-- GRANT EXECUTE ON FUNCTION public.activate_subscription_after_payment(UUID, TEXT, INTEGER, TIMESTAMPTZ)
--   TO authenticated;
