-- Ensure unique constraint on user_id in user_subscriptions table
-- This is needed for the upsert operation in the activate-subscription Edge Function

-- Check if the constraint already exists and add it if it doesn't
DO $$ 
BEGIN
    -- Try to add the unique constraint
    -- If it already exists, this will fail silently due to IF NOT EXISTS
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_user_id_key' 
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
        
        RAISE NOTICE 'Added unique constraint on user_subscriptions.user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on user_subscriptions.user_id already exists';
    END IF;
END $$;

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);

-- Add a comment to document the upsert capability
COMMENT ON CONSTRAINT user_subscriptions_user_id_key ON public.user_subscriptions 
IS 'Unique constraint on user_id enables upsert operations for subscription activation';