# InvoicePort Technical Documentation

> Last updated: March 23, 2026 — reflects all Phase 1–4 changes.

---

## Stack

| Layer        | Technology                                   |
| ------------ | -------------------------------------------- |
| Frontend     | React 18, Vite 5, Tailwind CSS, shadcn/ui    |
| Routing      | React Router DOM 6                           |
| Backend / DB | Supabase (PostgreSQL)                        |
| Auth         | Supabase Auth (JWT)                          |
| Email        | EmailJS (browser SDK) + Gmail API v1         |
| PDF          | jsPDF + html2canvas                          |
| Deployment   | Netlify (frontend), Supabase cloud (backend) |

---

## Architecture

### Auth Context (`src/context/AuthContext.jsx`)

Single source of truth for all auth state. Resolves on `onAuthStateChange` — no page-level `getUser()` calls anywhere.

```
onAuthStateChange(event, session)
    ↓
SIGNED_OUT → clear state
TOKEN_REFRESHED → update user only (skip DB calls)
SIGNED_IN / INITIAL_SESSION →
    Promise.allSettled([
        user_roles query  → isAdmin
        user_subscriptions query → subscriptionStatus
    ])
    ↓
Context provides: { user, isAdmin, subscriptionStatus, authLoading }
```

All pages and guards consume via `useAuth()`. Zero redundant network calls on navigation.

**Admin check:** DB-only via `user_roles` table. `VITE_ADMIN_EMAILS` is NOT used for access control — only for sending notification emails.

### Route Guards

| Guard               | Source      | Behavior                                         |
| ------------------- | ----------- | ------------------------------------------------ |
| `ProtectedRoute`    | `useAuth()` | Redirects to `/` if no user                      |
| `SubscriptionGuard` | `useAuth()` | Blocks expired subscriptions; fail-open on error |
| `AdminGuard`        | `useAuth()` | Shows Access Denied if `!isAdmin`                |

All guards read from context — no DB calls on mount.

---

## Gmail OAuth Security

Token exchange and refresh are proxied through Supabase Edge Functions. The client secret is **never** in the frontend bundle.

```
Frontend                    Edge Function              Google
   |                              |                       |
   |-- supabase.functions.invoke('gmail-token-exchange') →|
   |   { code, redirect_uri }     |                       |
   |                              |-- POST /token ------->|
   |                              |   { code, client_id,  |
   |                              |     client_secret }   |
   |                              |<-- { access_token,  --|
   |                              |     refresh_token }   |
   |<-- tokens ------------------|                       |
```

Required Edge Functions to deploy:

- `gmail-token-exchange` — exchanges auth code for tokens
- `gmail-token-refresh` — refreshes expired access token

Set the secret server-side: `supabase secrets set GMAIL_CLIENT_SECRET=...`

`VITE_GMAIL_CLIENT_SECRET` must NOT be set in `.env`.

---

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_GMAIL_CLIENT_ID=          # Safe to expose (public identifier)

# Optional
VITE_ADMIN_EMAILS=             # Notification emails only — NOT used for auth
VITE_ADMIN_EMAILJS_SERVICE_ID=
VITE_ADMIN_EMAILJS_PUBLIC_KEY=

# ⛔ NEVER SET THESE AS VITE_ VARIABLES
# VITE_GMAIL_CLIENT_SECRET     → use Supabase Edge Function secret instead
# VITE_EMAILJS_PRIVATE_KEY     → browser SDK doesn't need it
```

---

## Database Schema

### Core Tables

| Table                   | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `auth.users`            | Supabase managed auth                                     |
| `user_roles`            | Admin role assignments                                    |
| `user_subscriptions`    | Plan status and period                                    |
| `subscription_plans`    | Plan definitions (trial, monthly, yearly_pro, enterprise) |
| `subscription_requests` | Upgrade / payment verification requests                   |
| `business_settings`     | Company info, branding, Gmail tokens                      |
| `invoices`              | Invoice master records                                    |
| `invoice_items`         | Line items per invoice                                    |
| `customers`             | Customer directory                                        |
| `products`              | Product/service catalog                                   |
| `payments`              | Payment records                                           |
| `audit_logs`            | Activity log                                              |
| `email_usage_log`       | Per-send email tracking                                   |

### Key Invoice Fields

```sql
invoices (
  id uuid,
  user_id uuid,
  invoice_number text,        -- format: PREFIX-YY-RANDOM (e.g. INV-26-K8D4L2)
  invoice_mode text,          -- 'proforma' | 'tax_invoice'
  status text,                -- 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'converted'
  bill_to jsonb,              -- customer snapshot { name, email, address }
  from_details jsonb,         -- company snapshot
  items jsonb,                -- line items array
  grand_total numeric,
  currency text,
  template_id integer,
  converted_from_id uuid,     -- source proforma (if tax invoice)
  created_at timestamptz
)
```

> `customer_name`, `customer_email`, `customer_address`, `conversion_date`, `paid_at` do NOT exist as columns. Customer data lives in `bill_to` JSONB.

### RLS

All tables have Row Level Security enabled. Users only access rows where `user_id = auth.uid()`. Invoice verification page uses a public read policy scoped to `invoice_number` lookup only.

---

## Performance Patterns

### No Redundant Auth Calls

Every page behind `ProtectedRoute` is guaranteed to have `user` set by the time it mounts. Pages use:

```js
const { user, isAdmin, subscriptionStatus } = useAuth();
```

Never:

```js
// ❌ Don't do this in any page component
const {
  data: { user },
} = await supabase.auth.getUser();
```

### Branding Effect (Dashboard)

Uses `useRef` flag to apply branding settings exactly once after load — not on every keystroke:

```js
const brandingAppliedRef = useRef(false);
useEffect(() => {
  if (brandingAppliedRef.current) return;
  if (!brandingSettings.brandingCompanyName) return;
  brandingAppliedRef.current = true;
  setYourCompany((prev) => ({ ...prev, ...brandingSettings }));
}, [brandingSettings]);
```

### Analytics Query Limit

```js
supabase
  .from("invoices")
  .select("...")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(200); // prevents unbounded payload
```

---

## OTP / Password Reset

Rate limiting is enforced client-side on the "Forgot password?" button:

```js
// 60-second cooldown after each OTP send
setOtpCooldown(60);
// Button shows "Resend in 42s" and is disabled during cooldown
```

Server-side rate limiting is handled by Supabase Auth.

---

## robots.txt

```
Allow: /auth
Allow: /subscription

Disallow: /admin
Disallow: /template      # protected route — requires login
Disallow: /profile
Disallow: /branding
Disallow: /invoice-history
Disallow: /inventory
Disallow: /statistics
Disallow: /confirm-email
```

---

## Deleted / Removed Files

| File                                  | Reason                                            |
| ------------------------------------- | ------------------------------------------------- |
| `src/app.js`                          | Unused Alpine.js leftover                         |
| `src/components/BusinessSettings.jsx` | Duplicate of `BrandingSettings.jsx`, zero imports |
| `src/utils/invoiceEmailExample.js`    | Dev example file, never imported                  |
| `BUG_REPORT.md` (root)                | Moved to `.github/BUG_REPORT.md`                  |

---

## Audit Summary

56 issues audited across 11 categories. All 56 resolved across 4 phases.

| Category     | Issues | Fixed |
| ------------ | ------ | ----- |
| Critical     | 6      | 6 ✅  |
| Major        | 9      | 7     |
| Minor        | 5      | 5 ✅  |
| Logic Gaps   | 6      | 6 ✅  |
| Edge Cases   | 4      | 3     |
| UI/UX        | 5      | 5 ✅  |
| Performance  | 5      | 5 ✅  |
| Security     | 4      | 4 ✅  |
| SEO          | 3      | 1     |
| Code Quality | 5      | 5 ✅  |
| Architecture | 4      | 3     |

See `errors.md` for full details on every issue.
