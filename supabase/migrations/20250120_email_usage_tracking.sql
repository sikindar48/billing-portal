-- Email Usage Tracking System
-- This migration adds email usage tracking and plan-based restrictions

-- 1. Add email usage tracking to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS email_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_limit INTEGER DEFAULT 3; -- Default limit for trial users

-- 2. Update existing subscription plans with email limits
UPDATE public.subscription_plans 
SET features = CASE 
    WHEN slug = 'trial' THEN '{"3 Days Access", "Basic Invoicing", "PDF Export", "3 Email Sends (InvoicePort Mail)"}'
    WHEN slug = 'monthly' THEN '{"Unlimited Invoices", "Unlimited Emails", "Gmail Integration", "Priority Support", "Custom Branding"}'
    WHEN slug = 'yearly' THEN '{"All Pro Features", "Unlimited Emails", "Gmail Integration", "API Access", "Dedicated Account Manager"}'
    ELSE features
END;

-- 3. Create email usage log table for tracking
CREATE TABLE IF NOT EXISTS public.email_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    email_method TEXT NOT NULL, -- 'emailjs', 'gmail'
    status TEXT NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email usage log
ALTER TABLE public.email_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own email logs
CREATE POLICY "Users view own email logs" ON public.email_usage_log 
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own email logs
CREATE POLICY "Users insert own email logs" ON public.email_usage_log 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_usage_log_user_id ON public.email_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_log_sent_at ON public.email_usage_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_usage_log_status ON public.email_usage_log(status);

-- 4. Function to increment email usage with better error handling
CREATE OR REPLACE FUNCTION public.increment_email_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, ensure the user has a subscription record
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, email_usage_count, email_limit)
    SELECT 
        auth.uid(),
        (SELECT id FROM public.subscription_plans WHERE slug = 'trial' LIMIT 1),
        'trialing',
        0,
        3
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_subscriptions WHERE user_id = auth.uid()
    );

    -- Then increment the email usage count
    UPDATE public.user_subscriptions 
    SET email_usage_count = COALESCE(email_usage_count, 0) + 1
    WHERE user_id = auth.uid();
    
    -- Log the increment for debugging
    RAISE NOTICE 'Email usage incremented for user: %', auth.uid();
END;
$$;

-- 5. Function to check email usage limits with admin bypass
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
BEGIN
    -- Check if user is admin first
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_admin_user;
    
    -- If admin, return unlimited access
    IF is_admin_user THEN
        RETURN QUERY SELECT 
            true as can_send_email,
            0 as current_usage,
            999999 as email_limit,
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
        CASE WHEN sp.slug IN ('monthly', 'yearly') THEN true ELSE false END as is_pro_plan
    INTO user_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = auth.uid();

    -- If no subscription found, return default trial limits
    IF user_subscription IS NULL THEN
        RETURN QUERY SELECT 
            false as can_send_email,
            0 as current_usage,
            3 as email_limit,
            'No Plan' as plan_name,
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

-- 6. Function to log email usage with better error handling
CREATE OR REPLACE FUNCTION public.log_email_usage(
    p_invoice_id UUID,
    p_recipient_email TEXT,
    p_email_method TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    -- Insert the email log
    INSERT INTO public.email_usage_log (
        user_id,
        invoice_id,
        recipient_email,
        email_method,
        status,
        error_message
    ) VALUES (
        auth.uid(),
        p_invoice_id,
        p_recipient_email,
        p_email_method,
        p_status,
        p_error_message
    ) RETURNING id INTO log_id;

    -- If email was sent successfully, increment usage counter
    IF p_status = 'sent' THEN
        -- Ensure user has subscription record first
        INSERT INTO public.user_subscriptions (user_id, plan_id, status, email_usage_count, email_limit)
        SELECT 
            auth.uid(),
            (SELECT id FROM public.subscription_plans WHERE slug = 'trial' LIMIT 1),
            'trialing',
            0,
            3
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_subscriptions WHERE user_id = auth.uid()
        );

        -- Increment usage count
        UPDATE public.user_subscriptions 
        SET email_usage_count = COALESCE(email_usage_count, 0) + 1
        WHERE user_id = auth.uid();
        
        RAISE NOTICE 'Email usage incremented for successful send. User: %, Log ID: %', auth.uid(), log_id;
    END IF;

    RETURN log_id;
END;
$$;

-- 7. Update existing trial users with email limits
UPDATE public.user_subscriptions 
SET 
    email_usage_count = 0,
    email_limit = 3
WHERE plan_id IN (
    SELECT id FROM public.subscription_plans WHERE slug = 'trial'
) AND email_limit IS NULL;

-- 8. Update pro users with unlimited email
UPDATE public.user_subscriptions 
SET 
    email_usage_count = COALESCE(email_usage_count, 0),
    email_limit = 999999
WHERE plan_id IN (
    SELECT id FROM public.subscription_plans WHERE slug IN ('monthly', 'yearly')
);

-- Verify the migration
SELECT 'Email usage tracking system created successfully' as status;