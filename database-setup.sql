-- Complete Database Setup for Invoice Bill Generator
-- Run this script in your new Supabase project's SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- 2. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
CREATE POLICY "Public view plans" ON public.subscription_plans 
  FOR SELECT USING (true);

-- 5. Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id INTEGER REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  invoice_usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- User subscriptions policies
CREATE POLICY "Users view own subscription" ON public.user_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription" ON public.user_subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscription" ON public.user_subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create subscription_requests table
CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id INTEGER REFERENCES public.subscription_plans(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Subscription requests policies
CREATE POLICY "Users create requests" ON public.subscription_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view requests" ON public.subscription_requests 
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Create branding_settings table
CREATE TABLE public.branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  logo_url TEXT,
  company_name TEXT,
  website TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Branding settings policies
CREATE POLICY "Users view own branding" ON public.branding_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own branding" ON public.branding_settings 
  FOR ALL USING (auth.uid() = user_id);

-- 8. Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  bill_to JSONB,
  ship_to JSONB,
  invoice_details JSONB,
  from_details JSONB,
  items JSONB,
  tax NUMERIC(5, 2) DEFAULT 0,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  grand_total NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  template_name TEXT DEFAULT 'Template 1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users view own invoices" ON public.invoices 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own invoices" ON public.invoices 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own invoices" ON public.invoices 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own invoices" ON public.invoices 
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create user_drafts table
CREATE TABLE public.user_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  form_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_drafts ENABLE ROW LEVEL SECURITY;

-- User drafts policies
CREATE POLICY "Users view own drafts" ON public.user_drafts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own drafts" ON public.user_drafts 
  FOR ALL USING (auth.uid() = user_id);

-- 10. Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) DEFAULT 0,
  category TEXT,
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users view own products" ON public.products 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own products" ON public.products 
  FOR ALL USING (auth.uid() = user_id);

-- 11. Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logos bucket
CREATE POLICY "Users can upload logos" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view logos" ON storage.objects 
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Users can update own logos" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own logos" ON storage.objects 
  FOR DELETE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 12. Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, price, billing_period, features) VALUES
('Starter Trial', 'trial', 0, 'one_time', '{"3 Days Access", "Basic Invoicing", "PDF Export"}'),
('Pro Monthly', 'monthly', 29.00, 'monthly', '{"Unlimited Invoices", "Priority Support", "Custom Branding"}'),
('Enterprise Yearly', 'yearly', 290.00, 'yearly', '{"All Pro Features", "API Access", "Dedicated Account Manager"}')
ON CONFLICT (slug) DO NOTHING;

-- 13. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- 14. Create function to handle new user subscription
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_plan_id INTEGER;
BEGIN
  SELECT id INTO trial_plan_id FROM public.subscription_plans WHERE slug = 'trial' LIMIT 1;
  
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
    NOW() + INTERVAL '3 days'
  );
  
  RETURN NEW;
END;
$$;

-- 15. Create function to assign user roles
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- 16. Create function to increment invoice usage
CREATE OR REPLACE FUNCTION public.increment_invoice_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions 
  SET invoice_usage_count = invoice_usage_count + 1,
      updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

-- 17. Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_role();

-- 18. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 19. Add updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.branding_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_drafts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 20. Create indexes for better performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_branding_settings_user_id ON public.branding_settings(user_id);

-- Setup complete!
-- Your database is now ready for the Invoice Bill Generator application.