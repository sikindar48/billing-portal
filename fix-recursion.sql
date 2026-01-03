-- Fix Infinite Recursion in Admin Policies
-- Run this in your Supabase SQL Editor

-- 1. Drop all existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins update subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins insert subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins view all requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Admins update requests" ON public.subscription_requests;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;

-- 2. Create simple admin policies using direct email check (no recursion)
-- This avoids the circular dependency by checking email directly instead of roles table

-- Profiles - allow specific admin emails to view all profiles
CREATE POLICY "Admin emails view all profiles" ON public.profiles 
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

-- User subscriptions - allow admin emails to view/modify all subscriptions
CREATE POLICY "Admin emails view all subscriptions" ON public.user_subscriptions 
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

CREATE POLICY "Admin emails update subscriptions" ON public.user_subscriptions 
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

CREATE POLICY "Admin emails insert subscriptions" ON public.user_subscriptions 
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

-- Subscription requests - allow admin emails to view/update all requests
CREATE POLICY "Admin emails view all requests" ON public.subscription_requests 
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

CREATE POLICY "Admin emails update requests" ON public.subscription_requests 
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

-- User roles - allow admin emails to view all roles (but keep existing user policy)
CREATE POLICY "Admin emails view all roles" ON public.user_roles 
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

-- 3. Also allow admin emails to view subscription plans
CREATE POLICY "Admin emails view plans" ON public.subscription_plans 
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('nssoftwaresolutions1@gmail.com', 'admin@invoiceport.com')
  );

-- 4. Test the fix by checking if policies exist
SELECT 'Admin policies created:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE policyname LIKE '%Admin emails%' OR policyname LIKE '%admin emails%'
ORDER BY tablename, policyname;

-- Recursion fix complete!
-- Admin dashboard should now work without infinite recursion errors.