-- 1. Create the function to handle role assignment
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email matches the admin email
  IF NEW.email = 'nssoftwaresolutions1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Assign regular user role to all other users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create the trigger (fires after a user signs up)
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_role();

-- 3. Update branding_settings table
-- Safely add the 'website' column if it doesn't exist yet
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'branding_settings' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE public.branding_settings ADD COLUMN website text;
    END IF;
END $$;

-- 4. (OPTIONAL) Manual fix for existing Admin
-- If you have ALREADY signed up with this email, the trigger won't fire for you.
-- Run this specific block to manually promote your existing user to admin:
/*
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'nssoftwaresolutions1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
*/