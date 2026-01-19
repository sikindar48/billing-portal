-- Add Gmail OAuth fields to business_settings table
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS gmail_access_token TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS gmail_token_expires TIMESTAMPTZ;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS gmail_email TEXT;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS preferred_email_method TEXT DEFAULT 'emailjs';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON public.business_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_email_method ON public.business_settings(preferred_email_method);

-- Update RLS policies to include new fields
-- (The existing policies should already cover these new columns)