-- Migration: Create invoice_payments table
-- Created at: 2026-05-07

CREATE TABLE IF NOT EXISTS public.invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL, -- 'cash', 'bank_transfer', 'upi', 'card', 'other'
    transaction_id TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own invoice payments" 
    ON public.invoice_payments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice payments" 
    ON public.invoice_payments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice payments" 
    ON public.invoice_payments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice payments" 
    ON public.invoice_payments FOR DELETE 
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON public.invoice_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON public.invoice_payments(payment_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoice_payments_updated_at
    BEFORE UPDATE ON public.invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
