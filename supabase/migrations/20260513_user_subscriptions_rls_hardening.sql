-- H-02: Close free-upgrade path — authenticated users must not UPDATE/INSERT subscription rows.
-- Writes go through SECURITY DEFINER (payment RPC, email usage, new-user trigger, admin_override_subscription)
-- or admin RLS for manual verification in Admin UI.

DROP POLICY IF EXISTS "Users update own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users upsert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users insert own subscription" ON public.user_subscriptions;

-- Platform admins: read all rows (analytics) and upsert when approving manual payments.
CREATE POLICY "Admins select all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins insert any subscription"
  ON public.user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins update any subscription"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

COMMENT ON POLICY "Admins select all subscriptions" ON public.user_subscriptions IS
  'Admin dashboard analytics and verification; ordinary users use "Users view own subscription" only.';
