-- Fix check_email_limit RPC to report real usage for admins
-- This ensures the dashboard accurately reflects sent emails even for admin accounts
CREATE OR REPLACE FUNCTION public.check_email_limit()
RETURNS TABLE(
    can_send_email BOOLEAN,
    current_usage INTEGER,
    email_limit INTEGER,
    plan_name TEXT,
    is_pro BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_subscription RECORD;
    is_admin_user BOOLEAN := false;
    actual_usage INTEGER := 0;
BEGIN
    -- Check if user is admin first
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_admin_user;
    
    -- Get current usage count regardless of role
    SELECT email_usage_count INTO actual_usage
    FROM public.user_subscriptions
    WHERE user_id = auth.uid();
    
    -- If admin, return platform-wide usage with universal limit
    IF is_admin_user THEN
        SELECT count(*) INTO actual_usage
        FROM public.platform_resend_email_events
        WHERE created_at >= date_trunc('month', now());

        RETURN QUERY SELECT 
            true as can_send_email,
            COALESCE(actual_usage, 0)::integer as current_usage,
            3000 as email_limit,
            'Admin' as plan_name,
            true as is_pro;
        RETURN;
    END IF;

    -- Get user subscription with plan details
    SELECT 
        us.email_usage_count,
        us.email_limit,
        sp.name as plan_name,
        sp.slug,
        CASE WHEN sp.slug IN ('monthly', 'yearly', 'pro') THEN true ELSE false END as is_pro_plan
    INTO user_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = auth.uid();

    -- If no subscription found, return default trial limits (fallback to true for new users)
    IF user_subscription IS NULL THEN
        RETURN QUERY SELECT 
            true as can_send_email,
            0 as current_usage,
            3 as email_limit,
            'Free Trial' as plan_name,
            false as is_pro;
        RETURN;
    END IF;

    -- Return the results
    RETURN QUERY SELECT 
        CASE 
            WHEN user_subscription.is_pro_plan THEN true
            ELSE COALESCE(user_subscription.email_usage_count, 0) < COALESCE(user_subscription.email_limit, 3)
        END as can_send_email,
        COALESCE(user_subscription.email_usage_count, 0) as current_usage,
        CASE 
            WHEN user_subscription.is_pro_plan THEN 999999 -- Unlimited for pro
            ELSE COALESCE(user_subscription.email_limit, 3)
        END as email_limit,
        user_subscription.plan_name,
        user_subscription.is_pro_plan as is_pro;
END;
$$;

COMMENT ON FUNCTION public.check_email_limit() IS 'Checks email limits and returns current usage. Admins bypass limits but their actual usage is reported.';
