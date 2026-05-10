-- Enforce subscription limits at the database level [Fix for C-07]

-- 1. Create the enforcement function
CREATE OR REPLACE FUNCTION public.enforce_invoice_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan_slug TEXT;
    v_usage_count INTEGER;
    v_limit INTEGER := 10; -- Default trial limit
BEGIN
    -- Get user's current plan and usage
    -- Note: We use SECURITY DEFINER to read user_subscriptions which might have strict RLS
    SELECT 
        p.slug,
        s.invoice_usage_count
    INTO 
        v_plan_slug,
        v_usage_count
    FROM public.user_subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = NEW.user_id;

    -- If no subscription found, assume trial
    IF v_plan_slug IS NULL THEN
        v_plan_slug := 'trial';
    END IF;

    -- If user is on trial, enforce limit
    IF v_plan_slug = 'trial' THEN
        -- Check current count of invoices in the table
        SELECT count(*) INTO v_usage_count 
        FROM public.invoices 
        WHERE user_id = NEW.user_id;

        IF v_usage_count >= v_limit THEN
            RAISE EXCEPTION 'Invoice limit reached (10/10). Please upgrade to Pro for unlimited invoices.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Attach the trigger to the invoices table
DROP TRIGGER IF EXISTS tr_enforce_invoice_limit ON public.invoices;
CREATE TRIGGER tr_enforce_invoice_limit
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_invoice_limit();

-- 3. Update increment_invoice_usage to actually DO something (for analytics)
CREATE OR REPLACE FUNCTION public.increment_invoice_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET invoice_usage_count = COALESCE(invoice_usage_count, 0) + 1,
      updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;
