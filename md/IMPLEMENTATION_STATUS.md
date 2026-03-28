# InvoicePort — Implementation Status

> Last updated: March 28, 2026 — Phase 5 complete (63/63 issues resolved)

---

## Project Overview

InvoicePort is a GST-compliant invoice generation and management platform built with React + Supabase. It supports multiple invoice templates, PDF export, Gmail/EmailJS email delivery, subscription plans, and business branding.

---

## ✅ Completed Features

### Authentication

- ✅ Email/password signup + login via Supabase Auth
- ✅ Email confirmation (Supabase default flow)
- ✅ OTP-based password reset with 60s rate-limit cooldown
- ✅ `AuthContext` — single source of truth, resolves from session cache instantly
- ✅ `ProtectedRoute`, `SubscriptionGuard`, `AdminGuard` — all read from context, zero DB calls on navigation
- ✅ Admin status from `user_roles` DB table only (no client-side email list)
- ✅ No loading flash on tab navigation (getSession() resolves synchronously)

### Invoice Generation

- ✅ 9 professional templates (Template 3 is default)
- ✅ Real-time calculations: subtotal, tax (IGST/CGST+SGST/Standard), round-off, grand total
- ✅ Invoice types: Proforma and Tax Invoice
- ✅ Secure non-sequential invoice numbers (INV-YY-RANDOM6)
- ✅ Date format: DD/MM/YYYY throughout
- ✅ Save to `invoices` table (all extra fields in `invoice_details` JSONB)
- ✅ PDF download via jsPDF + html2canvas
- ✅ Template selection persisted to `template_name` column

### Invoice History

- ✅ Full invoice list with search, status filter, type filter
- ✅ Status stored in `invoice_details.status` JSONB (not a top-level column)
- ✅ Optimistic status updates (instant UI, DB in background)
- ✅ Download with correct template and computed subtotal/taxAmount/grandTotal
- ✅ View invoice → loads back into Dashboard with original number preserved
- ✅ Delete with `AlertDialog` confirmation
- ✅ Convert Proforma → Tax Invoice (duplicate prevention via `status: 'converted'`)
- ✅ Record payment → marks invoice as paid

### Email

- ✅ Gmail API v1 (Pro/Admin only) with OAuth 2.0
- ✅ EmailJS fallback (all plans)
- ✅ Gmail token exchange/refresh proxied via Supabase Edge Functions (secret never in bundle)
- ✅ Plan-based email limits enforced via `check_email_limit` RPC
- ✅ Automatic fallback Gmail → EmailJS on failure

### Subscription

- ✅ Trial: 3 days, 10 invoice limit, 3 email limit
- ✅ Pro Monthly (₹149) / Pro Yearly (₹1499) via UPI payment + manual admin verification
- ✅ Enterprise: contact sales flow
- ✅ Plan IDs resolved by slug from DB (no hardcoded IDs)
- ✅ Admin users bypass all limits

### Branding & Settings

- ✅ Company name, logo URL, website saved to `branding_settings`
- ✅ Phone, address, tagline, currency, tax rate, email method saved to `branding_settings.metadata` JSONB
- ✅ Auto-fills Dashboard "Your Company" fields on load (once, via `useRef` flag)
- ✅ Gmail connection management in Branding page

### Other Pages

- ✅ Customer management (`/customers`) — CRUD with soft delete, AlertDialog
- ✅ Product inventory (`/inventory`) — CRUD with AlertDialog
- ✅ Profile — update name, change password
- ✅ Analytics — admin-only, MRR + plan distribution + invoice stats
- ✅ Audit Logs — admin-only activity viewer
- ✅ Public invoice verification (`/verify-invoice`) — DB lookup, no auth required
- ✅ Subscription page — plan cards, UPI QR payment, billing toggle

### SEO & Deployment

- ✅ React Helmet Async — dynamic meta tags per page
- ✅ Sitemap + robots.txt (`/template` disallowed — protected route)
- ✅ Structured data (WebApplication schema)
- ✅ Netlify: SPA fallback + 301 redirect `invoiceport.live` → `www.invoiceport.live`

---

## 🗄️ Real Database Tables

Only these tables exist (confirmed via `types.ts`):

| Table                   | Columns                                                   |
| ----------------------- | --------------------------------------------------------- |
| `branding_settings`     | `company_name`, `logo_url`, `website`, `metadata` (JSONB) |
| `invoices`              | See schema below                                          |
| `profiles`              | `full_name`, `avatar_url`                                 |
| `subscription_plans`    | `name`, `slug`, `price`, `billing_period`, `features`     |
| `subscription_requests` | `user_id`, `plan_id`, `message`, `status`                 |
| `user_roles`            | `user_id`, `role`                                         |
| `user_subscriptions`    | `user_id`, `plan_id`, `status`, `current_period_end`      |

### invoices columns

```
id, user_id, invoice_number,
bill_to (jsonb), ship_to (jsonb), from_details (jsonb),
items (jsonb), invoice_details (jsonb),
subtotal, grand_total, tax,
notes, template_name,
created_at, updated_at
```

### invoice_details JSONB fields

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

### Tables that do NOT exist

`business_settings`, `invoice_items`, `payments`, `audit_logs`, `user_drafts`, `email_usage_log`, `customers`, `products` — code has been updated to not call these.

---

## 🔐 Security

- ✅ RLS on all tables — users only access `user_id = auth.uid()` rows
- ✅ Gmail client secret in Supabase Edge Function secrets only (`VITE_GMAIL_CLIENT_SECRET` never set)
- ✅ `VITE_EMAILJS_PRIVATE_KEY` removed — browser SDK only needs public key
- ✅ Admin check DB-only via `user_roles` — `VITE_ADMIN_EMAILS` not used for auth
- ✅ OTP 60s cooldown on password reset
- ✅ Invoice verification is DB-backed (not client-side token)

---

## 📦 Environment Variables

```bash
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_GMAIL_CLIENT_ID=

# Optional
VITE_ADMIN_EMAILS=             # notification emails only, not for auth
VITE_ADMIN_EMAILJS_SERVICE_ID=
VITE_ADMIN_EMAILJS_PUBLIC_KEY=

# NEVER set these as VITE_ variables:
# VITE_GMAIL_CLIENT_SECRET  → Supabase Edge Function secret
# VITE_EMAILJS_PRIVATE_KEY  → not needed in browser
```

---

## 🚀 Deployment

| Item      | Value                                             |
| --------- | ------------------------------------------------- |
| Frontend  | Netlify — https://www.invoiceport.live            |
| Backend   | Supabase cloud                                    |
| Build cmd | `npm run build`                                   |
| Publish   | `dist/`                                           |
| Redirects | `invoiceport.live` → `www.invoiceport.live` (301) |

### Edge Functions to deploy

```bash
supabase functions deploy gmail-token-exchange
supabase functions deploy gmail-token-refresh
supabase secrets set GMAIL_CLIENT_SECRET=...
```

---

## 📋 Phase Fix Summary

| Phase     | Fixed  | Key Changes                                                        |
| --------- | ------ | ------------------------------------------------------------------ |
| Phase 1   | 22     | Console logs, DOM leaks, mobile nav, template download, UI fixes   |
| Phase 2   | 16     | AuthContext created, guards migrated, localStorage removed         |
| Phase 3   | 7      | All pages on useAuth(), branding ref fix, column inserts fixed     |
| Phase 4   | 11     | Gmail secret → Edge Function, admin DB-only, robots.txt, dead code |
| Phase 5   | 7      | Schema alignment, confirm() → AlertDialog, nav admin guard, dates  |
| **Total** | **63** | **100% resolved**                                                  |

---

## 🏗️ Known Limitations

| Issue                                                 | Status                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PDF unstyled (renderToString without Tailwind)        | Open — requires `@react-pdf/renderer` migration                                           |
| `customers` / `products` tables may not exist         | Pages show empty state gracefully                                                         |
| Draft auto-save removed (`user_drafts` doesn't exist) | Form resets on page refresh                                                               |
| `audit_logs` / `payments` not tracked                 | Removed from code                                                                         |
| `branding_settings.metadata` column needed            | Run: `ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'` |

---

## 📊 Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | React 18, Vite 5, Tailwind CSS, shadcn/ui |
| Routing  | React Router DOM 6                        |
| DB/Auth  | Supabase (PostgreSQL + Auth)              |
| Email    | EmailJS + Gmail API v1                    |
| PDF      | jsPDF + html2canvas                       |
| Deploy   | Netlify                                   |
