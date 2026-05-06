-- Fix RLS policies for user_subscriptions table
-- The issue: Users can INSERT but not UPDATE their subscriptions
-- This causes activation to hang on the UPDATE operation

-- Add UPDATE policy for users to update their own subscriptions
CREATE POLICY "Users update own subscription" ON public.user_subscriptions 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Also add UPSERT capability by allowing users to handle conflicts
-- This ensures the upsert operation works properly
CREATE POLICY "Users upsert own subscription" ON public.user_subscriptions 
  FOR ALL USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Verify the policies are working
COMMENT ON POLICY "Users update own subscription" ON public.user_subscriptions 
IS 'Allows users to update their own subscription records for plan upgrades';

COMMENT ON POLICY "Users upsert own subscription" ON public.user_subscriptions 
IS 'Allows users to perform upsert operations on their own subscription records';