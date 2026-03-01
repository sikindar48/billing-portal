-- Create audit_logs table
-- This migration creates the audit_logs table with all required columns

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_identity_type TEXT NOT NULL DEFAULT 'user',
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_identity_type ON public.audit_logs(user_identity_type);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Users can view their own logs
CREATE POLICY "Users view own audit logs" ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all logs (using email-based admin check since user_roles may not exist)
CREATE POLICY "Admins view all audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'nssoftwaresolutions1@gmail.com',
            'admin@invoiceport.com'
        )
    );

-- Allow authenticated users to insert logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Add comment to table
COMMENT ON TABLE public.audit_logs IS 'Tracks all system activities and changes for security and compliance';

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
ORDER BY ordinal_position;
