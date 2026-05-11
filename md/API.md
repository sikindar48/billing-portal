# InvoicePort — API Reference (Edge Functions & RPCs)

**Last updated:** May 12, 2026  
**Base URL:** `https://<PROJECT_REF>.supabase.co`  
**Invocations:** `POST https://<PROJECT_REF>.supabase.co/functions/v1/<function-name>`

Common headers:

- `Authorization: Bearer <access_token>` — User JWT **or** `service_role` key (only server-side; never expose service role in the browser).
- `apikey: <SUPABASE_ANON_KEY>` — Required for Supabase gateway (browser uses anon key).
- `Content-Type: application/json`

---

## 1. Edge Functions

### `send-email`

**Auth:** User JWT **or** service role (required).

**Body (examples by `type`):**

| `type` | Required fields | Notes |
|--------|-----------------|-------|
| `ping` | — | No Resend call; health check. |
| `welcome` | `to`, `user_name` | `to` must equal JWT user email. |
| `otp` | `to`, `otp_code`, `purpose?`, `expires_in?` | **Blocked** for user JWT; only **service_role** (e.g. `request-otp` internal call). |
| `subscription_confirmation` | `to`, `user_name`, `plan_name`, `amount`, `billing_cycle`, `period_end` | `to` must equal JWT user email. |
| `invoice` | `to`, `invoice_number`, `amount`, `currency`, `due_date`, `verify_url`, `user_name`, `attachment?` | Recipients must match invoice `bill_to` email for that `invoice_number` and user. |

**Success:** `{ "success": true, "id": "<resend_id>" }`  
**Side effect:** Inserts `platform_resend_email_events` on successful Resend send.

---

### `request-otp`

**Auth:** Optional user JWT; anon allowed for password reset.

**Body:** `{ "email": string, "purpose": string }`  
**Behavior:** For `password_reset`, checks `auth_email_exists` before creating OTP / sending mail (uniform success if no account).

---

### `reset-password`

**Body:** `{ "action": "check" | "reset", "email"?, "new_password"?, "otp_id"? }`  
**Notes:** Prefer uniform responses for `check` to avoid enumeration (`md/security.md`).

---

### `razorpay-create-order`

**Auth:** User JWT required.

**Body:** `{ "planSlug", "planPrice", "planName" }` — prices validated against server allowlist.

---

### `verify-payment-and-activate`

**Auth:** User JWT required.

**Body:** `{ "razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "planSlug", "planName", "planPrice" }`  
**Behavior:** Verifies HMAC, activates subscription via RPC, updates `payment_orders`, may insert `subscription_requests` row, sends **subscription confirmation** email via internal `send-email` (service role).

---

### `gmail-token-exchange` / `gmail-token-refresh`

**Auth:** User JWT (typical).  
**Purpose:** Exchange OAuth code / refresh Gmail tokens stored in app tables.

---

## 2. Notable Supabase RPCs (PostgREST)

| RPC | Role | Purpose |
|-----|------|---------|
| `get_user_invoices` | authenticated | List invoices for `auth.uid()`. |
| `update_invoice_status` | authenticated | Update status for caller’s invoice. |
| `verify_invoice_public` | anon / authenticated | Public verify; masked PII. |
| `verify_otp_securely` | anon / authenticated | Verify OTP row. |
| `internal_create_otp` | **service_role only** | Create OTP (Edge `request-otp`). |
| `auth_email_exists` | **service_role only** | Exists check for password-reset path. |
| `activate_subscription_after_payment` | **service_role only** | Payment pipeline. |
| `get_admin_users_detailed` | authenticated + admin role | Admin user grid. |
| `get_admin_payment_reconciliation` | authenticated + admin role | Payment orders grid. |
| `admin_override_subscription` | authenticated + admin role | Manual trial/extension. |
| `get_admin_resend_email_stats` | authenticated + admin role | Resend usage JSON for current month. |

---

## 3. PostgREST tables (direct `from().select()`)

Most tables use **RLS**; the browser uses the **anon key + user JWT**. Inserts/updates allowed per policy (see migrations). Admin-heavy reads often go through **RPCs** above.

---

## 4. Versioning

Edge Functions run on **Deno** in Supabase; lock versions in dashboard or `import_map` if you need reproducible deploys.

---

*For table columns, see `md/DATABASE_SCHEMA.md` and individual SQL migrations.*
