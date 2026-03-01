-- Create RPC functions to bypass PostgREST schema cache issues
-- These functions execute SQL directly, bypassing the REST API layer

-- Function to update invoice status
CREATE OR REPLACE FUNCTION update_invoice_status(
    p_invoice_id UUID,
    p_user_id UUID,
    p_status TEXT,
    p_sent_at TIMESTAMPTZ DEFAULT NULL,
    p_paid_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    status TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the invoice
    UPDATE invoices
    SET 
        status = p_status,
        sent_at = COALESCE(p_sent_at, sent_at),
        paid_at = COALESCE(p_paid_at, paid_at),
        updated_at = NOW()
    WHERE invoices.id = p_invoice_id 
        AND invoices.user_id = p_user_id;
    
    -- Return the updated invoice
    RETURN QUERY
    SELECT 
        invoices.id,
        invoices.invoice_number,
        invoices.status,
        invoices.sent_at,
        invoices.paid_at
    FROM invoices
    WHERE invoices.id = p_invoice_id 
        AND invoices.user_id = p_user_id;
END;
$$;

-- Function to get invoices (bypass schema cache)
CREATE OR REPLACE FUNCTION get_user_invoices(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    customer_name TEXT,
    bill_to JSONB,
    ship_to JSONB,
    invoice_data JSONB,
    your_company JSONB,
    items JSONB,
    tax_percentage NUMERIC,
    tax_type TEXT,
    enable_round_off BOOLEAN,
    tax_amount NUMERIC,
    subtotal NUMERIC,
    grand_total NUMERIC,
    notes TEXT,
    currency TEXT,
    status TEXT,
    invoice_mode TEXT,
    converted_from_id UUID,
    conversion_date TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.invoice_number,
        i.customer_name,
        i.bill_to,
        i.ship_to,
        i.invoice_data,
        i.your_company,
        i.items,
        i.tax_percentage,
        i.tax_type,
        i.enable_round_off,
        i.tax_amount,
        i.subtotal,
        i.grand_total,
        i.notes,
        i.currency,
        i.status,
        i.invoice_mode,
        i.converted_from_id,
        i.conversion_date,
        i.sent_at,
        i.paid_at,
        i.created_at,
        i.updated_at
    FROM invoices i
    WHERE i.user_id = p_user_id
    ORDER BY i.created_at DESC;
END;
$$;

-- Function to insert audit log
CREATE OR REPLACE FUNCTION insert_audit_log(
    p_user_id UUID,
    p_user_identity_type TEXT,
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_details TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        user_identity_type,
        action_type,
        resource_type,
        resource_id,
        details,
        old_values,
        new_values
    ) VALUES (
        p_user_id,
        p_user_identity_type,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        p_old_values,
        p_new_values
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_invoice_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION insert_audit_log TO authenticated;

-- Verify functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('update_invoice_status', 'get_user_invoices', 'insert_audit_log')
ORDER BY routine_name;

SELECT 'RPC functions created successfully. These bypass PostgREST schema cache.' as message;
