-- User Branding & Business Information System
-- This migration creates the necessary tables for multi-tenant branding

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create Business Settings Table (User-specific branding)
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Company Information
  company_name TEXT NOT NULL DEFAULT 'My Business',
  company_email TEXT,
  company_phone TEXT,
  company_website TEXT,
  
  -- Address Information
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'India',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1', -- Indigo
  secondary_color TEXT DEFAULT '#8b5cf6', -- Purple
  
  -- Invoice Settings
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_number_start INTEGER DEFAULT 1001,
  currency TEXT DEFAULT 'INR',
  tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST rate
  
  -- Payment Information
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  
  -- Email Settings
  email_signature TEXT,
  email_footer TEXT,
  
  -- Email Delivery Configuration
  preferred_email_method TEXT DEFAULT 'emailjs', -- emailjs, smtp, gmail, sendgrid, mailgun
  
  -- SMTP Settings
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT, -- Should be encrypted in production
  smtp_secure BOOLEAN DEFAULT true,
  
  -- Third-party Email Service Settings
  sendgrid_api_key TEXT,
  mailgun_api_key TEXT,
  mailgun_domain TEXT,
  gmail_refresh_token TEXT, -- For Gmail OAuth
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own business settings
CREATE POLICY "Users view own business settings" ON public.business_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own business settings" ON public.business_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own business settings" ON public.business_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create Clients Table (User-specific clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Client Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Business Details
  gstin TEXT, -- GST number for Indian businesses
  pan TEXT,   -- PAN number
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Users can manage their own clients
CREATE POLICY "Users manage own clients" ON public.clients 
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create Services/Products Table (User-specific catalog)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'piece', -- piece, hour, day, month, etc.
  tax_rate DECIMAL(5,2), -- Override default tax rate if needed
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Users can manage their own services
CREATE POLICY "Users manage own services" ON public.services 
  FOR ALL USING (auth.uid() = user_id);

-- 5. Create function to initialize user business settings
CREATE OR REPLACE FUNCTION public.handle_new_user_business_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  -- Create default business settings
  INSERT INTO public.business_settings (user_id, company_name, company_email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Business'),
    NEW.email
  );
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created_business_setup ON auth.users;
CREATE TRIGGER on_auth_user_created_business_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_business_setup();

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 8. Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_business_settings
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();