-- Create invoices table
-- This is the main table for storing invoice data

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  
  -- Customer information (JSON for flexibility)
  bill_to JSONB NOT NULL,
  ship_to JSONB,
  customer_name TEXT,
  customer_email TEXT,
  customer_address TEXT,
  
  -- Company information (JSON for flexibility)
  from_details JSONB NOT NULL,
  your_company JSONB,
  
  -- Invoice details
  invoice_details JSONB NOT NULL,
  issue_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  
  -- Line items
  items JSONB NOT NULL,
  
  -- Financial calculations
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(5, 2),
  tax_percentage NUMERIC(5, 2),
  tax_type TEXT,
  tax_amount NUMERIC(10, 2),
  enable_round_off BOOLEAN DEFAULT false,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Currency
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  
  -- Additional information
  notes TEXT,
  terms TEXT,
  template_name TEXT,
  template_id INTEGER,
  
  -- Invoice type and status
  invoice_mode TEXT DEFAULT 'tax_invoice', -- 'tax_invoice', 'proforma', 'receipt'
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  
  -- Conversion tracking (for proforma to tax invoice)
  converted_from_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  conversion_date TIMESTAMPTZ,
  
  -- Status timestamps
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own invoices" ON public.invoices 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON public.invoices 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON public.invoices 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" ON public.invoices 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX idx_invoices_customer_name ON public.invoices(customer_name);

-- Create invoice_items table for line items (optional, for better normalization)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_items (inherit from parent invoice)
CREATE POLICY "Users can view own invoice items" ON public.invoice_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice items" ON public.invoice_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice items" ON public.invoice_items 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice items" ON public.invoice_items 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Create index for invoice_items
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Create function to increment invoice usage counter
CREATE OR REPLACE FUNCTION public.increment_invoice_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to track invoice creation
  -- Implementation depends on your usage tracking requirements
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_invoice_usage TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.invoices IS 'Main table for storing invoice data';
COMMENT ON COLUMN public.invoices.status IS 'Invoice status: draft, sent, paid, overdue, cancelled';
COMMENT ON COLUMN public.invoices.invoice_mode IS 'Invoice type: tax_invoice, proforma, receipt';
COMMENT ON COLUMN public.invoices.sent_at IS 'Timestamp when invoice was sent to customer';
COMMENT ON COLUMN public.invoices.paid_at IS 'Timestamp when invoice was marked as paid';

SELECT 'Invoices table and related structures created successfully' as message;
