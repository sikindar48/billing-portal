-- Create helper functions for database operations

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at on all tables
CREATE TRIGGER handle_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_updated_at TO authenticated;

SELECT 'Helper functions created successfully' as message;
