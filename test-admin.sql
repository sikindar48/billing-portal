-- Test Admin Setup
-- Run this after the admin-fixes.sql to verify everything works

-- 1. Check if admin user exists
SELECT 'Admin users:' as info;
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.created_at;

-- 2. Check subscription plans
SELECT 'Subscription plans:' as info;
SELECT id, name, slug, price, billing_period FROM public.subscription_plans;

-- 3. Check if admin functions exist
SELECT 'Admin functions:' as info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_admin_dashboard_data', 'delete_user_by_admin', 'is_admin');

-- 4. Test admin function (will only work if you're logged in as admin)
-- SELECT 'Testing admin dashboard function:' as info;
-- SELECT * FROM public.get_admin_dashboard_data() LIMIT 5;

-- 5. Check RLS policies for admin access
SELECT 'RLS policies for admin:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE policyname LIKE '%admin%' OR policyname LIKE '%Admin%'
ORDER BY tablename, policyname;