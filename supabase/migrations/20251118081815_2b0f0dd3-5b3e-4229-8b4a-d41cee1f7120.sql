-- 1. Create Subscription Plans Table
CREATE TABLE public.subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- 'trial', 'monthly', 'yearly'
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL, -- 'monthly', 'yearly', 'one_time'
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
-- Everyone can read plans
CREATE POLICY "Public view plans" ON public.subscription_plans FOR SELECT USING (true);


-- 2. Create User Subscriptions Table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id INTEGER REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL, -- 'trialing', 'active', 'canceled', 'expired'
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users view own subscription" ON public.user_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscription (needed for signup trigger mostly, but good for safety)
CREATE POLICY "Users insert own subscription" ON public.user_subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Create Subscription Requests Table (For manual admin approval flow)
CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id INTEGER REFERENCES public.subscription_plans(id),
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert requests
CREATE POLICY "Users create requests" ON public.subscription_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users view requests" ON public.subscription_requests 
  FOR SELECT USING (auth.uid() = user_id);


-- 4. Insert Default Plans
INSERT INTO public.subscription_plans (name, slug, price, billing_period, features) VALUES
('Starter Trial', 'trial', 0, 'one_time', '{"3 Days Access", "Basic Invoicing", "PDF Export"}'),
('Pro Monthly', 'monthly', 29.00, 'monthly', '{"Unlimited Invoices", "Priority Support", "Custom Branding"}'),
('Enterprise Yearly', 'yearly', 290.00, 'yearly', '{"All Pro Features", "API Access", "Dedicated Account Manager"}');


-- 5. Automation: Handle New User Trial
-- This function will be called by the trigger whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_plan_id INTEGER;
BEGIN
  -- Get the ID of the 'trial' plan
  SELECT id INTO trial_plan_id FROM public.subscription_plans WHERE slug = 'trial' LIMIT 1;

  -- Insert the subscription record
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    trial_plan_id,
    'trialing',
    NOW(),
    NOW() + INTERVAL '3 days' -- Set expiration to 3 days from now
  );

  RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users
-- Note: You already have a trigger 'on_auth_user_created' for profiles. 
-- We can add a second trigger or combine them. Adding a second is cleaner here.
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();