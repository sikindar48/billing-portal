-- Secure public invoice verification [Fix for H-04]

-- 1. Create a function to mask PII
CREATE OR REPLACE FUNCTION public.mask_text(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_text IS NULL OR length(p_text) < 2 THEN
        RETURN '***';
    END IF;
    -- Show first 2 chars, then stars, then last char if long enough
    RETURN left(p_text, 2) || '***' || right(p_text, 1);
END;
$$;

-- 2. Create the secure public verification RPC
CREATE OR REPLACE FUNCTION public.verify_invoice_public(p_search_term TEXT)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    company_name TEXT,
    customer_name_masked TEXT,
    status TEXT,
    grand_total NUMERIC,
    currency TEXT,
    issue_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    invoice_mode TEXT,
    is_authentic BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_is_uuid BOOLEAN;
BEGIN
    v_is_uuid := p_search_term ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    IF v_is_uuid THEN
        SELECT * INTO v_record FROM invoices WHERE id = p_search_term::uuid OR invoice_number = p_search_term LIMIT 1;
    ELSE
        SELECT * INTO v_record FROM invoices WHERE invoice_number = p_search_term LIMIT 1;
    END IF;

    IF v_record IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY SELECT 
        v_record.id,
        v_record.invoice_number,
        COALESCE(v_record.from_details->>'name', 'N/A'),
        mask_text(COALESCE(v_record.customer_name, v_record.bill_to->>'name', 'N/A')),
        v_record.status,
        v_record.grand_total,
        v_record.currency,
        v_record.issue_date,
        v_record.due_date,
        v_record.invoice_mode,
        true;
END;
$$;

-- 3. Permissions
GRANT EXECUTE ON FUNCTION public.verify_invoice_public(TEXT) TO anon, authenticated;
