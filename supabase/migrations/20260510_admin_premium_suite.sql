-- Admin Premium Suite: Database Engine [Modules 1, 2, 5, 6]

-- 1. Function to fetch all users with detailed status (User 360)
CREATE OR REPLACE FUNCTION public.get_admin_users_detailed()
RETURNS TABLE (
    out_profile_id UUID,
    out_email TEXT,
    out_full_name TEXT,
    out_company_name TEXT,
    out_logo_url TEXT,
    out_plan_slug TEXT,
    out_subscription_status TEXT,
    out_period_end TIMESTAMPTZ,
    out_invoice_count BIGINT,
    out_last_active TIMESTAMPTZ,
    out_created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only admins can run this
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access Denied: Admin only';
    END IF;

    RETURN QUERY
    SELECT 
        u.id as out_profile_id,
        u.email::text as out_email,
        COALESCE(p.full_name, 'N/A') as out_full_name,
        COALESCE(b.company_name, 'No Company') as out_company_name,
        b.logo_url as out_logo_url,
        COALESCE(plans.slug, 'trial') as out_plan_slug,
        COALESCE(s.status, 'trialing') as out_subscription_status,
        s.current_period_end as out_period_end,
        (SELECT count(*) FROM invoices WHERE invoices.user_id = u.id) as out_invoice_count,
        u.last_sign_in_at as out_last_active,
        u.created_at as out_created_at
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN branding_settings b ON u.id = b.user_id
    LEFT JOIN user_subscriptions s ON u.id = s.user_id
    LEFT JOIN subscription_plans plans ON s.plan_id = plans.id
    ORDER BY u.last_sign_in_at DESC NULLS LAST;
END;
$$;

-- 2. Function to fetch reconciliation data (Revenue Reconciliation)
CREATE OR REPLACE FUNCTION public.get_admin_payment_reconciliation()
RETURNS TABLE (
    order_id TEXT,
    payment_id TEXT,
    user_email TEXT,
    amount NUMERIC,
    status TEXT,
    plan_slug TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        o.order_id,
        o.payment_id,
        u.email::text,
        o.amount,
        o.status,
        o.plan_slug,
        o.created_at
    FROM payment_orders o
    JOIN auth.users u ON o.user_id = u.id
    ORDER BY o.created_at DESC;
END;
$$;

-- 3. Manual Override: Extend Trial or Activate Pro
CREATE OR REPLACE FUNCTION public.admin_override_subscription(
    p_user_id UUID,
    p_action TEXT, -- 'extend_trial', 'activate_pro'
    p_days INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pro_plan_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    IF p_action = 'extend_trial' THEN
        UPDATE user_subscriptions
        SET current_period_end = current_period_end + (p_days || ' days')::interval,
            status = 'trialing',
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN jsonb_build_object('success', true, 'message', 'Trial extended by ' || p_days || ' days');

    ELSIF p_action = 'activate_pro' THEN
        SELECT id INTO v_pro_plan_id FROM subscription_plans WHERE slug = 'monthly' LIMIT 1;
        
        INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
        VALUES (p_user_id, v_pro_plan_id, 'active', NOW(), NOW() + INTERVAL '1 month')
        ON CONFLICT (user_id) DO UPDATE SET
            plan_id = v_pro_plan_id,
            status = 'active',
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '1 month',
            updated_at = NOW();

        RETURN jsonb_build_object('success', true, 'message', 'Pro plan manually activated');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users_detailed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_payment_reconciliation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_override_subscription(UUID, TEXT, INTEGER) TO authenticated;
