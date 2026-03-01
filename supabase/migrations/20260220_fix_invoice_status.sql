-- Fix invoice status field for existing invoices
-- This migration ensures all invoices have a valid status value

-- Update any NULL status values to 'draft'
UPDATE invoices 
SET status = 'draft' 
WHERE status IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_invoices,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_count,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM invoices;
