# InvoicePort — Security Assessment (Pre-Launch)

**Assessment date:** May 12, 2026  
**Scope:** React/Vite frontend, Supabase (Postgres RLS, RPC, Edge Functions), Razorpay checkout, Gmail OAuth, admin area, public invoice verification.  
**Overall posture:** Critical payment and open-relay issues from earlier snapshots are **largely mitigated in code** (`send-email` auth, payment verify retries + reconcile, server-sent subscription email). **Remaining gaps** are mostly RLS hardening, Gmail HTML escaping, password-policy polish, and deployment controls (CSP, WAF)—see sections 2–4 and `md/audit.md`.

---

## Executive summary

| Area | Status |
|------|--------|
| **Razorpay (create order + verify)** | **Strong:** Same as before, plus **client retries + long timeout**, **DB reconciliation** if the HTTP response is lost, and **subscription confirmation email** sent from **`verify-payment-and-activate`** after successful RPC (so users still get mail if the tab errors). See `src/pages/subscription/SubscriptionPage.jsx`, `supabase/functions/verify-payment-and-activate/index.ts`. |
| **Invoice / trial limits** | **Improved:** `BEFORE INSERT` trigger `enforce_invoice_limit` enforces trial caps in the database (`supabase/migrations/20260510_enforce_invoice_limits.sql`). Invoice RPCs use `auth.uid()` (`supabase/migrations/20260220_create_rpc_functions.sql`). |
| **OTP / password reset** | **Improved:** OTP generation is in `internal_create_otp` (executable only by `service_role`); verification goes through `verify_otp_securely` (`supabase/migrations/20260510_secure_otp_system.sql`). Client `src/utils/otpService.js` delegates to `request-otp` + RPC. |
| **Public invoice verify** | **Improved:** Uses `verify_invoice_public` with masked customer name (`supabase/migrations/20260510_secure_public_verification.sql`, `src/pages/public/InvoiceVerify.jsx`). Some business-sensitive fields remain public (amount, dates, status)—see medium items. |
| **Gmail OAuth secrets** | **Improved vs older audits:** Client code uses `VITE_GMAIL_CLIENT_ID` only; `.env.example` documents keeping the secret in Supabase secrets. Token exchange is intended to run via Edge Functions (`supabase/functions/gmail-token-exchange`, `gmail-token-refresh`). |
| **Email Edge Function** | **Improved:** `send-email` requires a **valid user JWT** or **service role** bearer; recipient rules per type (`supabase/functions/send-email/index.ts`). Successful sends append to **`platform_resend_email_events`** for admin quota tracking (migration `20260512_platform_resend_email_events.sql`). |
| **`user_subscriptions` RLS** | **Weak:** Policies still allow authenticated users to **update** their own subscription row (`supabase/migrations/20260506_fix_user_subscriptions_rls.sql`), which can undermine plan enforcement if combined with other bugs. |
| **Admin UI** | **Improved:** `/admin`, `/admin/verify-payment`, and `/audit-logs` are wrapped in **`AdminGuard`** in `src/App.jsx` (in addition to admin RPC checks). Admin **Resend usage** tab calls `get_admin_resend_email_stats()` for monthly send totals vs a configurable reference limit (default 3000). |
| **Transport / hosting** | **Unknown from repo alone:** Security headers (CSP, `frame-ancestors`, `X-Content-Type-Options`), WAF, and TLS are deployment concerns—call them out below. |

---

## 1. Resolved or materially improved (since earlier internal audit)

The following items from the previous `security.md` draft are **addressed in the current tree** (always re-verify on your deployed Supabase instance that migrations were applied in order):

1. **Free “Pro” activation via client RPC (historical C-01)** — `activate_subscription_after_payment` is granted to **`service_role` only**; the `authenticated` grant is commented out (`supabase/migrations/20260508_activate_subscription_rpc.sql`). Frontend explicitly avoids RPC fallback after payment (`src/pages/subscription/SubscriptionPage.jsx`).

2. **IDOR-style invoice RPCs (historical C-06)** — `get_user_invoices()` and `update_invoice_status(...)` scope by **`auth.uid()`**, not a caller-supplied user id (`supabase/migrations/20260220_create_rpc_functions.sql`).

3. **Trial invoice limit only in UI (historical C-07)** — DB trigger `tr_enforce_invoice_limit` blocks inserts over the trial cap (`supabase/migrations/20260510_enforce_invoice_limits.sql`).

4. **Client-generated OTP (historical C-08)** — Generation moved server-side via `internal_create_otp` + `request-otp` Edge Function (`supabase/migrations/20260510_secure_otp_system.sql`, `supabase/functions/request-otp/index.ts`).

5. **Full PII on public verify (historical H-04)** — Replaced with `verify_invoice_public` + masking helper (`supabase/migrations/20260510_secure_public_verification.sql`).

6. **Gmail client secret in Vite bundle (historical C-03 / C-05)** — Current `.env.example` and `src/utils/gmailOAuthService.js` document **not** using `VITE_GMAIL_CLIENT_SECRET`; use Edge Functions + Supabase secrets for token exchange/refresh.

7. **`send-email` authentication (historical H-01)** — Bearer must be **user JWT** or **service role**; per-type recipient checks; SPA uses `supabase.functions.invoke` with session (no anon-only `fetch`). **`auth_email_exists`** RPC for password-reset OTP path (`supabase/migrations/20260511_auth_email_exists_rpc.sql`, `request-otp`).

8. **Payment UX / email reliability** — Verify flow retries + polls DB; subscription confirmation from **`verify-payment-and-activate`** after activation.

---

## 2. High — fix or explicitly accept before broad launch

### [H-01] ~~Unauthenticated `send-email`~~ **Addressed (May 2026)**

- **Files:** `supabase/functions/send-email/index.ts`, `src/pages/auth/AuthPage.jsx`, `LandingPage.jsx`, `SubscriptionPage.jsx`, `src/utils/otpService.js`, `supabase/functions/request-otp/index.ts`  
- **Status:** Callers must present **service role** or **valid user JWT**; user-path types are restricted (e.g. invoice recipient must match `bill_to` on the user’s invoice). **Ping** still requires auth. **Residual risk:** keep secrets out of client bundles and monitor **`platform_resend_email_events`** in admin.

### [H-02] Users can still mutate their own `user_subscriptions` row

- **Files:** `supabase/migrations/20260506_fix_user_subscriptions_rls.sql`  
- **Issue:** `FOR ALL` / `FOR UPDATE` policies allow the owner to change `plan_id`, `status`, `email_limit`, dates, etc., via the Supabase client if RLS is the only control. That recreates a **privilege escalation / entitlement bypass** class of bugs next to triggers and UI checks.  
- **Fix:** Reduce to **`SELECT` only** for `authenticated`; perform all writes through `SECURITY DEFINER` functions or service-role Edge Functions after payment or admin action.

### [H-03] HTML injection in Gmail invoice bodies (stored XSS in email HTML)

- **Files:** `src/utils/gmailInvoiceService.js` (template literals embedding `invoiceData.notes`, `billTo`, line items, branding, etc.)  
- **Issue:** User-controlled invoice fields are concatenated into HTML without escaping/sanitization. Risk is mainly **recipient mail clients** that execute HTML/JS (webmail, some mobile clients).  
- **Fix:** HTML-escape all dynamic strings, or sanitize with a vetted library before building MIME/HTML.

### [H-04] Password reset / existence disclosure

- **Files:** `supabase/functions/reset-password/index.ts` (`action === 'check'` returns **404** with `exists: false` vs **200** with `exists: true`)  
- **Issue:** Different status codes and bodies allow **email enumeration** and user scraping.  
- **Fix:** Constant-time / uniform response (same HTTP status, same body shape); always trigger the same UX (“If an account exists…”) regardless of existence.

### [H-05] Defense-in-depth: admin routes not consistently guarded in the router

- **Files:** `src/App.jsx`  
- **Issue:** `/admin`, `/admin/verify-payment`, and `/audit-logs` are behind `ProtectedRoute` only; **`AdminGuard` is used for `/analytics` and inside `AdminVerifyPayment`**, but **not** for the main admin dashboard or audit logs route. Admin RPCs raise `Access Denied` for non-admins, so **data** is mostly protected, but the surface area is inconsistent and easy to regress.  
- **Fix:** Wrap every admin path with `AdminGuard` (or a single `/admin/*` layout guard).

### [H-06] `reset-password` minimum password length 6

- **File:** `supabase/functions/reset-password/index.ts`  
- **Issue:** Six characters is below common policy (and OWASP-style guidance) for a SaaS handling payments and PII.  
- **Fix:** Enforce at least 10–12 characters with complexity or a breach-password list check on the server.

---

## 3. Medium

### [M-01] `verify-payment-and-activate` continues if the payment order DB read fails

- **File:** `supabase/functions/verify-payment-and-activate/index.ts`  
- **Issue:** On `orderErr`, the handler logs but does **not** abort, yet still activates the subscription when the Razorpay signature is valid. Signature already ties `order_id` + `payment_id`, but missing `payment_orders` rows weaken **bookkeeping, replay handling, and plan/amount cross-checks**.  
- **Fix:** Treat “no matching order for this user” as **400** after signature verify, or create the row idempotently from Razorpay metadata; then use a single **conditional update** (`UPDATE … WHERE status = 'created' RETURNING`) for completion.

### [M-02] No cross-check of paid **amount** against stored order

- **Files:** `verify-payment-and-activate/index.ts`, `payment_orders` schema  
- **Issue:** Plan slug mismatch is checked when a row exists; **amount** is not revalidated against Razorpay’s captured payment in this function.  
- **Fix:** Optionally fetch payment from Razorpay API with server credentials and compare `amount` / `currency` to `payment_orders.amount`.

### [M-03] Permissive CORS (`Access-Control-Allow-Origin: *`) on Edge Functions

- **Pattern:** Multiple functions under `supabase/functions/*/index.ts`  
- **Issue:** Easier abuse from arbitrary origins in the browser (especially where anon key + unauthenticated functions exist).  
- **Fix:** Restrict to your production origin(s) and localhost in dev.

### [M-04] `AuthContext` “fail open” to `subscriptionStatus: 'allowed'` on errors / timeout

- **File:** `src/context/AuthContext.jsx`  
- **Issue:** Transient DB failures or timeouts can mark the user as **allowed** when subscription state was never confirmed—weak for a billing product (better to fail closed or retry with backoff).  
- **Fix:** Distinguish “unknown” vs “allowed”; avoid granting paid features until subscription resolution succeeds.

### [M-05] `audit_logs` admin policy uses hardcoded JWT emails

- **File:** `supabase/migrations/20260220_create_audit_logs_table.sql`  
- **Issue:** Admin `SELECT` on all logs is tied to **`auth.jwt() ->> 'email' IN (...)`**, while newer admin RPCs use **`user_roles`**. Two different admin models drift over time; new admins on different emails see incomplete data or you end up editing SQL for each hire.  
- **Fix:** Use **only** `user_roles` (or a single `is_admin()` security definer function) for admin access to `audit_logs`.

### [M-06] Public verification still exposes financial and timing data

- **RPC:** `verify_invoice_public` returns `grand_total`, `issue_date`, `due_date`, etc.  
- **Issue:** Much safer than full PII dump, but still sensitive for some customers/regulators if invoice numbers are guessable or leaked in URLs.  
- **Fix:** Consider returning only **status + last four of invoice number** unless a signed token is presented.

### [M-07] OTP / harassment: `internal_create_otp` does not require a registered user

- **Files:** `supabase/migrations/20260510_secure_otp_system.sql`, `supabase/functions/request-otp/index.ts`  
- **Issue:** For `password_reset`, you generally want OTP **only** if the account exists; otherwise attackers can annoy arbitrary inboxes (rate limit is only 1/min per email in DB).  
- **Fix:** Add an existence check (via service role) before `internal_create_otp` for `password_reset`, while keeping a uniform HTTP response to avoid enumeration (combine with H-04).

### [M-08] `subscription_requests` policies (migrations) only cover insert + select

- **File:** `supabase/migrations/20251118081815_2b0f0dd3-5b3e-4229-8b4a-d41cee1f7120.sql`  
- **Issue:** No `UPDATE` policy shown for admins; if none was added elsewhere, **admin approval from the SPA may fail under RLS**, or a later migration may have widened access—this should be **verified in the live project** and documented.  
- **Fix:** Explicit `UPDATE` policy for admins only, or route approvals through a `SECURITY DEFINER` RPC.

---

## 4. Low / operational

- **Razorpay webhooks:** The repo flow is **client-driven verification** after checkout. For production SaaS, also configure **server-side webhooks** (payment.captured, etc.) for reconciliation, refunds, and late callbacks—do not rely on the browser alone.  
- **EmailJS:** `.env.example` still lists EmailJS keys for trial invoice email. Public keys are expected; ensure **no private keys** ever use the `VITE_` prefix. Prefer consolidating on Resend + server templates where possible.  
- **Logging:** Several modules log payment/order identifiers and auth outcomes to the console—trim in production builds.  
- **WAF / DDoS / bot protection:** Not represented in application code; use your hosting/CDN layer.  
- **HTTP security headers / CSP:** Still recommended (`Content-Security-Policy`, `X-Frame-Options` or `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`). Configure at CDN or static host.  
- **DNS / email:** SPF, DKIM, DMARC for `invoiceport.live` (and Resend alignment) to protect deliverability and abuse reputation.

---

## 5. Razorpay-specific checklist

- [x] **Key secret** only in Supabase secrets, not in Vite env (per `.env.example` guidance).  
- [x] **Order creation** authenticated and **price allowlist** enforced server-side (`razorpay-create-order`).  
- [x] **Signature verification** on the Edge Function before activation.  
- [ ] **Webhook endpoint** + idempotent ledger (recommended).  
- [ ] **Amount/currency** reconciliation against `payment_orders` (recommended).  
- [ ] **3DS / international** flows tested if you expand beyond INR cards.  

---

## 6. Admin portal checklist

- [x] **Privileged RPCs** (`get_admin_users_detailed`, `get_admin_payment_reconciliation`, `admin_override_subscription`) check `user_roles` (`supabase/migrations/20260510_admin_premium_suite.sql`).  
- [x] **Router-level `AdminGuard`** on `/admin`, `/admin/verify-payment`, and `/audit-logs` (`src/App.jsx`).  
- [ ] **Align** `audit_logs` admin access with `user_roles` (remove hardcoded email list or keep it as emergency break-glass only, documented).  
- [ ] **Manual payment page** (`AdminVerifyPayment.jsx`): confirm whether `supabase.auth.admin.*` from the browser is intentional; the anon client **cannot** perform admin auth API calls—verify fallbacks do not leak misleading data in UI.

---

## 7. Suggested remediation order (practical)

1. ~~**Lock down `send-email`**~~ **Done** — keep monitoring Resend admin tab.  
2. **Tighten `user_subscriptions` RLS** to SELECT-only for end users.  
3. **Escape/sanitize Gmail HTML** construction.  
4. **Normalize reset-password responses** and strengthen password policy.  
5. **Harden `verify-payment-and-activate`** (strict order row requirement + atomic status update + optional amount check).  
6. **Reconcile `audit_logs` policies** with `user_roles` (remove hardcoded JWT emails or document as break-glass only).  
7. **Deployment:** CSP, frame protections, WAF, Razorpay webhooks, email DNS.

---

## 8. Resend budget (~3,000 emails / month)

At **~100 sends/day**, abuse or duplicate paths will cap you quickly. Treat the items below as **both security and quota** work.

### Must-fix (quota + abuse)

| Item | Status / notes |
|------|----------------|
| **[H-01] Authenticate `send-email`** | **Done** — see §1 item 7. |
| **[M-07] OTP only for real accounts (`password_reset`)** | **Done** — `auth_email_exists` + uniform success when no user. |
| **Single server path to Resend** | **Done** — SPA uses `functions.invoke` + JWT; dev script `send-all-templates.js` uses **service role** only. |
| **Admin visibility** | **Done** — Admin → **Resend usage** tab + `get_admin_resend_email_stats()` (adjust `monthly_limit` constant in migration if your Resend tier changes). |

### Strongly recommended (save sends, fewer duplicates)

| Practice | Notes |
|----------|--------|
| **Invoice delivery** | **Pro users:** send via **Gmail** (`gmailInvoiceService.js`) — **zero Resend** per invoice. **Trial/free:** EmailJS path in `.env.example` uses Resend only where you explicitly wired `send-email`; avoid sending the same event twice (e.g. welcome from both **Landing** and **Auth** without idempotency). |
| **Stricter cooldowns** | OTP is already **1/min** in DB; align **UI** resend cooldowns (e.g. 60s → 2–5 minutes for password reset) to cut accidental double-sends. |
| **Skip low-value mail** | Optional: make “welcome” email **opt-in** or send once per user (flag in `profiles` / metadata) if signups are noisy. |
| **Health checks** | `type: 'ping'` in `send-email` already returns **without** calling Resend (`supabase/functions/send-email/index.ts`). Still authenticate `send-email` so strangers cannot use `ping` or other types to probe or abuse the function. |

### Optional (capacity planning)

- **Resend dashboard:** alerts when daily send count crosses a threshold (e.g. 80/day).  
- **Upgrade tier** on Resend when you approach consistent limits; code fixes above matter more first.

---

*This document is based on static analysis of the repository at audit time. Production deployments may differ if migrations, Supabase dashboard settings, or secrets are not aligned with this codebase.*
