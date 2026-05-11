# InvoicePort — Database Schema (Overview)

**Last updated:** May 12, 2026  
**Source of truth:** `supabase/migrations/*.sql` and `src/integrations/supabase/types.ts` (regenerate types after migrations: `supabase gen types typescript`).

This document is a **high-level map**. Column lists may omit rarely used fields; see migrations for exact DDL.

---

## 1. Auth-adjacent (Supabase-managed + public wrappers)

| Object | Purpose |
|--------|---------|
| `auth.users` | Supabase Auth users (managed by GoTrue). |
| `public.profiles` | App profile (`full_name`, etc.) linked to `auth.users.id`. |
| `public.user_roles` | `user_id` + `role` (`admin` / `user`). Populated by trigger on signup (`20251118084323_*.sql`). **Table creation may live in remote Lovable baseline** — migrations reference it. |

---

## 2. Subscriptions & payments

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plans (`trial`, `monthly`, `yearly`) with price, features. |
| `user_subscriptions` | One row per user: `plan_id`, `status`, period dates, `email_usage_count`, `email_limit`, etc. |
| `subscription_requests` | Manual / workflow requests; status `pending` / `approved` / `rejected`. |
| `payment_orders` | Razorpay `order_id`, amount, `user_id`, `status` (`created`, `completed`, …). |
| `invoice_payments` | Payments recorded against invoices (separate from Razorpay subscription orders). |

**Notable RPCs:** `activate_subscription_after_payment` (service_role only), `admin_override_subscription`, `get_admin_users_detailed`, `get_admin_payment_reconciliation`.

---

## 3. Invoicing

| Table | Purpose |
|-------|---------|
| `invoices` | Core invoice JSON (`bill_to`, `items`, totals, `status`, `invoice_number`, …). |
| `invoice_items` | Optional normalized line items (if used by migration path). |

**RPCs:** `get_user_invoices()`, `update_invoice_status(...)`, `verify_invoice_public(p_search_term)` (masked public verify).

**Triggers:** `tr_enforce_invoice_limit` — trial invoice cap at DB level.

---

## 4. Branding & CRM / catalog

| Table | Purpose |
|-------|---------|
| `branding_settings` | Company branding, logos, metadata (used heavily by dashboard + Gmail paths). |
| `business_settings` | Parallel/legacy business fields; some code paths still read it (e.g. invoice email company name). **Two tables coexist** — consider consolidating long-term. |
| `clients` | Customer records. |
| `services` | Service / product catalog lines. |

---

## 5. Email & OTP

| Table | Purpose |
|-------|---------|
| `email_usage_log` | Per-send log for **invoice-related** sends (recipient, method `gmail` / `default_mail`, status). |
| `otp_verifications` | OTP rows; **insert** only via `internal_create_otp` (service_role). |
| `platform_resend_email_events` | **One row per successful Resend API send** from `send-email` Edge Function (`20260512_*.sql`). Used for admin quota. |

**RPCs:** `log_email_usage`, `increment_email_usage`, `verify_otp_securely`, `internal_create_otp` (service only), `auth_email_exists` (service only), `get_admin_resend_email_stats` (admin JWT).

---

## 6. Security & audit

| Table | Purpose |
|-------|---------|
| `audit_logs` | User/admin actions; RLS includes legacy **JWT email allowlist** for admin read — see `md/security.md`. |

---

## 7. Relationships (simplified)

```
auth.users 1──1 profiles
          1──1 user_subscriptions ──N subscription_plans
          1──N invoices
          1──N payment_orders
          1──N email_usage_log
          1──1 branding_settings (typical)
user_roles.user_id → auth.users.id
```

---

## 8. Applying changes

```bash
supabase db push   # or link remote and push migrations
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

*For API shapes of Edge Functions and HTTP bodies, see `md/API.md`.*
