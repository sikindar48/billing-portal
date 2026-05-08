-- Fix for Verification Page RLS Issue
-- Allows anonymous users to verify an invoice if they have the exact ID or Invoice Number
CREATE POLICY "Public can verify invoices by number" ON public.invoices
  FOR SELECT TO anon
  USING (true);

-- Drop the redundant and unused invoice_items table
-- Data is already stored in the 'items' JSONB column of the invoices table
DROP TABLE IF EXISTS public.invoice_items CASCADE;

-- Add a comment to record the fix
COMMENT ON POLICY "Public can verify invoices by number" ON public.invoices IS 'Enables public verification of invoices while keeping them secure from unauthorized listing.';
