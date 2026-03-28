# InvoicePort Technical Documentation

> Last updated: March 28, 2026 — reflects all Phase 1–5 changes.

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

Single source of truth for all auth state. Calls `getSession()` immediately on mount (resolves from local cache — no network round-trip) so route guards never flash a spinner on tab navigation.

```
mount
  └─ getSession() [cache, instant]
       ├─ no session → authLoading = false, user = null
       └─ session found →
            Promise.allSettled([
                user_roles query  → isAdmin
                user_subscriptions query → subscriptionStatus
            ])
            → authLoading = false

onAuthStateChange (background listener)
  ├─ SIGNED_OUT       → clear all state
  ├─ TOKEN_REFRESHED  → update user only (skip DB calls)
  ├─ INITIAL_SESSION  → skip if already resolved by getSession()
  └─ SIGNED_IN        → resolve admin + subscription fresh
```

Context provides: `{ user, isAdmin, subscriptionStatus, authLoading }`

All pages and guards consume via `useAuth()`. Zero redundant network calls on navigation.

**Admin check:** DB-only via `user_roles` table. `VITE_ADMIN_EMAILS` is NOT used for access control — only for sending notification emails.

### Route Guards

| Guard               | Source      | Behavior                                         |
| ------------------- | ----------- | ------------------------------------------------ |
| `ProtectedRoute`    | `useAuth()` | Redirects to `/` if no user                      |
| `SubscriptionGuard` | `useAuth()` | Blocks expired subscriptions; fail-open on error |
| `AdminGuard`        | `useAuth()` | Shows Access Denied if `!isAdmin`                |

All guards read from context — no DB calls on mount. Spinner only shows when `authLoading` is true (first load with no cached session).

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

# NEVER SET THESE AS VITE_ VARIABLES
# VITE_GMAIL_CLIENT_SECRET     → use Supabase Edge Function secret instead
# VITE_EMAILJS_PRIVATE_KEY     → browser SDK doesn't need it
```

---

## Database Schema

### Real Tables (confirmed in types.ts)

| Table                   | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `auth.users`            | Supabase managed auth                                     |
| `branding_settings`     | Company name, logo URL, website (per user)                |
| `invoices`              | Invoice master records — all fields documented below      |
| `profiles`              | User display name, avatar                                 |
| `subscription_plans`    | Plan definitions (trial, monthly, yearly_pro, enterprise) |
| `subscription_requests` | Upgrade / payment verification requests                   |
| `user_roles`            | Admin role assignments                                    |
| `user_subscriptions`    | Plan status and period end date                           |

### invoices — Actual Columns

```
invoices (
  id              uuid  PK
  user_id         uuid  FK → auth.users
  invoice_number  text                    -- e.g. INV-26-K8D4L2
  bill_to         jsonb                   -- { name, email, address, phone }
  ship_to         jsonb                   -- { name, address, phone }
  from_details    jsonb                   -- { name, address, phone, website, logo_url, tagline }
  items           jsonb                   -- [{ name, description, quantity, amount, total }]
  invoice_details jsonb                   -- all extra fields (see below)
  subtotal        numeric
  grand_total     numeric
  tax             numeric                 -- tax percentage (e.g. 18)
  notes           text
  template_name   text                    -- e.g. "template_3"
  created_at      timestamptz
  updated_at      timestamptz
)
```

### invoice_details JSONB structure

All fields that are NOT top-level columns live here:

```json
{
  "number": "INV-26-K8D4L2",
  "date": "28/03/2026",
  "paymentDate": "28/03/2026",
  "invoiceMode": "proforma",
  "status": "draft",
  "taxType": "IGST",
  "taxAmount": 1800,
  "enableRoundOff": false,
  "roundOffAmount": 0,
  "currency": "INR",
  "currency_symbol": "₹"
}
```

**Status values:** `draft` | `sent` | `paid` | `cancelled` | `converted`

**invoiceMode values:** `proforma` | `tax_invoice`

> `customer_name`, `customer_email`, `customer_address`, `due_date`, `issue_date`,
> `invoice_mode`, `status`, `tax_amount`, `currency`, `currency_symbol`, `template_id`,
> `terms`, `converted_from_id` do NOT exist as top-level columns.
> Customer data lives in `bill_to` JSONB. Extra fields live in `invoice_details` JSONB.

### Tables That Do NOT Exist

The following tables are referenced in older code but do not exist in the DB.
All code has been updated to not call them:

- `business_settings` → replaced by `branding_settings`
- `invoice_items` → items stored in `invoices.items` JSONB
- `payments` → not tracked in DB currently
- `audit_logs` → not tracked in DB currently
- `user_drafts` → draft auto-save removed
- `email_usage_log` → not tracked in DB currently
- `customers` → not in DB currently
- `products` → not in DB currently

### RLS

All tables have Row Level Security enabled. Users only access rows where `user_id = auth.uid()`.

---

## Invoice Save Flow

```
handleSaveToDatabase()
  ├─ Validate: billTo.name, billTo.email, items, grandTotal > 0
  ├─ Check usage limit (skip for admins)
  └─ supabase.from('invoices').insert({
         user_id, invoice_number,
         subtotal, grand_total, tax,
         notes, template_name,
         bill_to, ship_to, from_details, items,
         invoice_details: {
           number, date, paymentDate,
           invoiceMode, status: 'draft',
           taxType, taxAmount, enableRoundOff,
           roundOffAmount, currency, currency_symbol
         }
     })
     └─ supabase.rpc('increment_invoice_usage')
```

---

## Date Format

All dates are stored and displayed as `DD/MM/YYYY`.

- `toDisplayDate(str)` helper in Dashboard converts any `YYYY-MM-DD` → `DD/MM/YYYY`
- Date inputs use `type="text"` with `DD/MM/YYYY` placeholder
- Invoice history reads date from `invoice.invoice_details.date`

---

## PDF Generation

Default template: **Template 3** (`selectedTemplateId = 3`).

```
handleDownload(invoice)
  ├─ Compute: taxAmt = subtotal * tax / 100
  ├─ Read template: parseInt(template_name.replace('template_', '')) || 3
  └─ generatePDF(formData, templateNumber)
       ├─ ReactDOMServer.renderToString(<InvoiceTemplate>)
       ├─ html2canvas (scale: 2)
       └─ jsPDF → save as PDF
```

> Known limitation: `renderToString` renders without Tailwind styles applied.
> PDFs may appear unstyled. Fix requires rendering into a mounted DOM node
> or migrating to `@react-pdf/renderer`.

---

## Performance Patterns

### No Redundant Auth Calls

Every page behind `ProtectedRoute` is guaranteed to have `user` set. Use:

```js
const { user, isAdmin, subscriptionStatus } = useAuth();
```

Never call `supabase.auth.getUser()` in page components.

### No Draft Auto-Save

The debounced `user_drafts` upsert was removed (`user_drafts` table doesn't exist).
Form state is in-memory only — refreshing the page resets the form.

### Branding Effect (Dashboard)

Uses `useRef` flag to apply branding settings exactly once after load:

```js
const brandingAppliedRef = useRef(false);
useEffect(() => {
  if (brandingAppliedRef.current) return;
  if (!brandingSettings.brandingCompanyName) return;
  brandingAppliedRef.current = true;
  setYourCompany((prev) => ({ ...prev, ...brandingDefaults }));
}, [brandingSettings]);
```

### Dashboard API Calls on Mount

Only 2 DB calls on Dashboard load:

1. `branding_settings` — company name, logo
2. `user_subscriptions` — plan + usage count

Email capability check only fires when "Send Mail" is clicked.

---

## OTP / Password Reset

Rate limiting enforced client-side on the "Forgot password?" button:

```js
setOtpCooldown(60); // 60-second cooldown after each OTP send
// Button shows "Resend in 42s" and is disabled during cooldown
```

Server-side rate limiting handled by Supabase Auth.

---

## Netlify Config

```toml
# Redirect non-www to www (canonical domain)
[[redirects]]
  from = "https://invoiceport.live/*"
  to   = "https://www.invoiceport.live/:splat"
  status = 301
  force  = true

# SPA fallback
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```

---

## robots.txt

```
Allow: /
Allow: /auth
Allow: /subscription

Disallow: /admin
Disallow: /template
Disallow: /profile
Disallow: /branding
Disallow: /invoice-history
Disallow: /inventory
Disallow: /dashboard
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

63 issues audited across 12 categories. All 63 resolved across 5 phases.

| Phase   | Issues Fixed | Key Changes                                                |
| ------- | ------------ | ---------------------------------------------------------- |
| Phase 1 | 22           | Console logs, DOM leaks, mobile nav, template download fix |
| Phase 2 | 16           | AuthContext created, guards migrated, localStorage removed |
| Phase 3 | 7            | Remaining pages migrated to useAuth(), branding ref fix    |
| Phase 4 | 11           | Gmail secret → Edge Function, admin DB-only, robots.txt    |
| Phase 5 | 7            | Schema alignment, confirm() → AlertDialog, nav admin guard |
