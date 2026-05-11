-- PostgREST keeps a schema cache; new RPCs can return PGRST202 until it reloads.
-- This runs after migrations so hosted Supabase picks up functions like get_admin_resend_email_stats().
NOTIFY pgrst, 'reload schema';
