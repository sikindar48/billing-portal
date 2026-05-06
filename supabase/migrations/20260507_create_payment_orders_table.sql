-- Create payment_orders table to track Razorpay orders
-- This table stores order information for verification and prevents replay attacks

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE, -- Razorpay order_id
  payment_id TEXT, -- Razorpay payment_id (filled after payment)
  signature TEXT, -- Razorpay signature (filled after verification)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_slug TEXT NOT NULL, -- 'monthly', 'yearly'
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  receipt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created', -- 'created', 'completed', 'signature_failed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment orders
CREATE POLICY "Users view own payment orders" ON public.payment_orders 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payment orders (via Edge Function)
CREATE POLICY "Users insert own payment orders" ON public.payment_orders 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON public.payment_orders(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.payment_orders IS 'Tracks Razorpay payment orders for verification and audit trail';
COMMENT ON COLUMN public.payment_orders.order_id IS 'Razorpay order ID returned from order creation API';
COMMENT ON COLUMN public.payment_orders.payment_id IS 'Razorpay payment ID received after successful payment';
COMMENT ON COLUMN public.payment_orders.signature IS 'Razorpay signature for payment verification';
COMMENT ON COLUMN public.payment_orders.status IS 'Order status: created, completed, signature_failed, failed';
