# InvoicePort Pre-Launch Security Audit Report

**Audit Date:** May 10, 2026  
**Status:** **CRITICAL FAIL**  
**Summary:** Multiple critical vulnerabilities were found in payment logic, authentication, and credential management. These MUST be fixed before going live to prevent financial loss and data breaches.

---

## 1. CRITICAL FINDINGS

### [C-01] Free Upgrade Exploit via Unprotected RPC
- **Severity:** CRITICAL
- **File:** `supabase/migrations/20260508_activate_subscription_rpc.sql` (Line 75)
- **Vulnerability:** The `activate_subscription_after_payment` RPC is a `SECURITY DEFINER` function granted to the `authenticated` role. It accepts `p_plan_id` and `p_period_end` as arguments without verifying that a payment actually occurred.
- **Impact:** Any logged-in user can call this function via the browser console to give themselves a "Pro Yearly" plan indefinitely for free.
- **Fix:**
    1. Remove `GRANT EXECUTE ON FUNCTION ... TO authenticated;`.
    2. Rewrite the function to check `payment_orders` for a record with `status = 'paid'` and a valid `payment_id` before activating.

### [C-02] Unauthorized Email Relay via Edge Function
- **Severity:** CRITICAL
- **File:** `supabase/functions/send-email/index.ts`
- **Vulnerability:** The function lacks any authorization checks. It does not verify the Supabase JWT or `apikey`.
- **Impact:** Attackers can use your Resend API quota to send spam or phishing emails from `info@invoiceport.live` to any recipient.
- **Fix:** Implement JWT verification using `supabase.auth.getUser(token)` at the start of the function.

### [C-03] Exposure of Gmail OAuth Client Secret
- **Severity:** CRITICAL
- **File:** `src/utils/gmailInvoiceService.js` (Line 6)
- **Vulnerability:** `GMAIL_CLIENT_SECRET` is imported via `import.meta.env.VITE_GMAIL_CLIENT_SECRET`.
- **Impact:** Any variable prefixed with `VITE_` is bundled into the frontend. An attacker can extract your Google Client Secret and use it to impersonate your application or perform unauthorized OAuth operations.
- **Fix:**
    1. Remove `VITE_GMAIL_CLIENT_SECRET` from `.env` and the frontend code.
    2. Move Gmail token exchange and refreshing to a Supabase Edge Function using `service_role` and environment secrets.

### [C-04] Subscription Data Tampering via RLS
- **Severity:** CRITICAL
- **File:** `supabase/migrations/20260506_fix_user_subscriptions_rls.sql` (Line 12)
- **Vulnerability:** The RLS policy `Users upsert own subscription` allows `FOR ALL` (including UPDATE) where `auth.uid() = user_id`.
- **Impact:** Users can directly edit their subscription record in the database via the Supabase client to change `plan_id` to `3` (Yearly) and `email_limit` to `999999`.
- **Fix:** Restrict `user_subscriptions` to `SELECT` only for users. Updates must only happen via `SECURITY DEFINER` functions that verify payment.

### [C-05] Unauthenticated Token Refresh
- **Severity:** CRITICAL
- **File:** `src/utils/gmailInvoiceService.js` (Line 143)
- **Vulnerability:** `refreshGmailAccessToken` performs a client-side POST to `oauth2.googleapis.com/token` exposing the client secret in the network trace and the bundle.
- **Fix:** This logic must be moved to the backend (Edge Functions).

---

## 2. HIGH FINDINGS

### [H-01] XSS in Gmail Invoice Templates
- **Severity:** HIGH
- **File:** `src/utils/gmailInvoiceService.js` (Line 187-309)
- **Vulnerability:** User-supplied data (`billTo.name`, `notes`, etc.) is injected into a raw HTML string using template literals without sanitization.
- **Impact:** If an attacker creates an invoice with malicious scripts in the "Notes" field, the script will execute when the recipient opens the email in certain web-based email clients.
- **Fix:** Use `DOMPurify` to sanitize all user inputs before injecting them into the HTML string.

### [H-02] Server-Side Plan Limit Bypass
- **Severity:** HIGH
- **File:** `supabase/migrations/20260305_create_invoices_table.sql` (Line 73)
- **Vulnerability:** The `INSERT` policy for `invoices` does not check if the user has exceeded their plan's invoice limit.
- **Impact:** Free users can bypass frontend restrictions and create thousands of invoices via direct API calls.
- **Fix:** Add a check to the `INSERT` policy or use a `BEFORE INSERT` trigger to validate the current invoice count against the user's plan.

### [H-03] Exposure of EmailJS Private Key
- **Severity:** HIGH
- **File:** `.env` (Line 10)
- **Vulnerability:** `VITE_EMAILJS_PRIVATE_KEY` is defined. If this is used in the frontend, it is exposed.
- **Fix:** Remove EmailJS from the frontend entirely. Consolidate all email logic to the `send-email` Edge Function using Resend.

---

## 3. MEDIUM FINDINGS

### [M-01] Permissive CORS Policy
- **Severity:** MEDIUM
- **File:** All Edge Functions (`index.ts`)
- **Vulnerability:** `Access-Control-Allow-Origin` is set to `*`.
- **Fix:** Change to `https://invoiceport.live` (and localhost for dev).

### [M-02] Race Condition in Payment Verification
- **Severity:** MEDIUM
- **File:** `supabase/functions/verify-payment-and-activate/index.ts` (Lines 103-152)
- **Vulnerability:** Read-then-write pattern for checking `payment_orders` status.
- **Fix:** Use `UPDATE payment_orders SET status = 'completed' WHERE order_id = $1 AND status = 'created' RETURNING *` to ensure atomicity.

### [M-03] Poor UX on Payment Timeout
- **Severity:** MEDIUM
- **File:** `src/pages/subscription/SubscriptionPage.jsx` (Line 186)
- **Vulnerability:** 30s timeout just shows a toast.
- **Fix:** Redirect to a `/payment/verify?order_id=...` page that polls the DB for the final status.

---

## 4. NEXT STEPS & REMEDIATION

1. **IMMEDIATE:** Revoke `GRANT EXECUTE` on `activate_subscription_after_payment` from `authenticated`.
2. **IMMEDIATE:** Add Auth guard to `send-email` edge function.
3. **IMMEDIATE:** Remove all `VITE_` prefixed secrets.
4. **REWRITE:** Move all Gmail OAuth and sending logic to Supabase Edge Functions.
5. **LOCKDOWN:** Update RLS on `user_subscriptions` to prevent user-initiated updates.
🛑 NEW CRITICAL FINDINGS
[C-06] Massive IDOR in RPC Functions: The functions get_user_invoices and update_invoice_status in supabase/migrations/20260220_create_rpc_functions.sql take p_user_id as a parameter and do not verify it against auth.uid().

Impact: Any logged-in user can view, edit, or delete any other user's invoices simply by passing their user_id.
[C-07] Total Bypass of Subscription Limits: The increment_invoice_usage function (called when saving an invoice) is a NO-OP (it literally just says RETURN;).

Impact: The "10 invoice limit" for trial users is only enforced in the UI. Anyone can bypass it by calling the API directly to create unlimited invoices without paying.
[C-08] Insecure OTP Generation (Account Takeover): In src/utils/otpService.js, the 6-digit OTP code is generated in the browser and inserted into the database by the client.

Impact: An attacker can generate their own OTP for your email, insert it into the DB via the client (assuming RLS allows it), and then use the reset-password Edge Function to take over your account.
[H-04] Public PII Leakage: The InvoiceVerify.jsx page is public and returns the full PII (Name, Email, Address, Total Amount) of any customer if the attacker guesses the invoice number.

Impact: Serious data privacy (GDPR/PII) violation. Public verification should only show the status (e.g., "Paid"), not customer details.
[H-05] Email Enumeration: The reset-password Edge Function returns exists: true/false, allowing an attacker to scrape your database to find valid user emails.

Updated Remediation Priority:
Fix RPC IDORs: Update all RPCs to use auth.uid() instead of a parameter.
Move OTP Logic: Generate OTPs only inside a SECURITY DEFINER Postgres function or a secure Edge Function. Never generate secrets in the browser.
Enforce Limits in DB: Add a trigger to the invoices table that checks the user's subscription limit before allowing an INSERT.
Sanitize Public Verify: Modify the verification query to only return status, invoice_number, and company_name.


Hardening Improvements

Protection

No website application firewall detected. Please install a cloud-based WAF to prevent website hacks and DDoS attacks.
Consider creating an SPF record to prevent spammers from abusing your email address.
Security Headers

Missing security header for ClickJacking Protection. Alternatively, you can use Content-Security-Policy: frame-ancestors 'none'.
Missing security header to prevent Content Type sniffing.
Missing Content-Security-Policy directive. We recommend to add the following CSP directives (you can use default-src if all values are the same): script-src, object-src, base-uri, frame-src
