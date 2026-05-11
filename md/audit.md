# InvoicePort — Product, UX & Codebase Audit

**Audit date:** May 12, 2026  
**Audience:** Operators, developers, and security review.  
**Companion docs:** `md/security.md`, `md/DATABASE_SCHEMA.md`, `md/API.md`, `md/FEATURES_FLOW.md`.

---

## 1. Executive summary

The app delivers **real value** (invoicing, Razorpay upgrades, Gmail/Resend mail, admin console). Several **marketing lines on the landing page overstate** polish (e.g. “milliseconds”, “bank-grade”, “24/7 support”). There is **duplicate/legacy code** (`GmailCallback.jsx` vs `GmailCallbackNew.jsx`). **`ConfirmEmail.jsx` cannot work as written** for end users (it calls `supabase.auth.admin` from the browser). **Analytics** previously queried non-existent columns on `email_usage_log`; that path is fixed to use `count` + `user_subscriptions`. **Empty directories:** none found under the repo (excluding `node_modules` / `dist`).

---

## 2. Landing page vs actual product (possible “false promises”)

| Claim (Landing / hero) | Reality in codebase | Severity |
|------------------------|---------------------|----------|
| “Instant generation” / “milliseconds” | PDF and UI work well; timing is network- and device-dependent, not guaranteed sub‑ms. | Wording |
| “Bank-grade security” / “Enterprise-grade encryption” | Supabase + TLS + recent auth fixes; **not** a certified banking audit. Avoid regulated-sector wording. | Legal / trust |
| “9 Professional Templates” (was on landing) | Landing updated to **10**; `templateRegistry.js` has `Template1`–`Template10`. | **Fixed** in UI copy |
| “Live Analytics” (feature card) | User analytics exist; depth depends on plan; admin analytics mix real and placeholder metrics. | Mild |
| “24/7 dedicated customer support” (email template copy in `subscription.ts` features list) | No ticketing integration in repo; support is manual email. | Marketing |
| “API Access” (legacy plan feature text in migrations / copy) | No public REST API product for tenants in this repo. | **Remove or reword** |
| “Automated Financial Suite v2.0” (hero badge) | No separate “suite” product; it is the web app. | Cosmetic |
| “No credit card required” | True for trial signup; paid plans use Razorpay. | OK |
| “3-day free trial” | Matches `AuthContext` / subscription logic (3 days from `user.created_at` when no row). | OK |

**Recommendation:** Soften superlatives, align template count to **10**, remove “API access” until shipped, align “support” copy with actual channels.

---

## 3. User flow & UX gaps

| Area | Issue | Impact |
|------|--------|--------|
| **Email confirmation** | `ConfirmEmail.jsx` uses `supabase.auth.admin.listUsers()` from the **anon client** — will fail in production for normal users. | Broken or dead route |
| **Welcome email** | If Supabase requires **email confirmation** before session, signup may **not** return `session`; welcome via `invoke('send-email')` is skipped. | Missing welcome mail |
| **`user_subscriptions` RLS** | Users can still **UPDATE** own row (migration `20260506_fix_user_subscriptions_rls.sql`); plan enforcement relies on triggers + server paths. | Abuse / confusion |
| **Admin `AdminVerifyPayment`** | Uses `supabase.auth.admin.getUserById` from browser — **not** possible with anon key; UI may show wrong fallback. | Admin UX |
| **Fail-open subscription** | `AuthContext` sets `subscriptionStatus: 'allowed'` on some errors/timeouts. | Rare free access to gated routes |
| **CORS `*`** on Edge Functions | Broader attack surface for browser abuse (mitigated after `send-email` auth). | Residual |

---

## 4. Dead, duplicate, or risky code

| Item | Location | Note |
|------|----------|------|
| **Legacy Gmail callback page** | `src/pages/public/GmailCallback.jsx` | **Not** routed in `App.jsx` (route uses `GmailCallbackNew`). Candidate **deletion** after confirming no external OAuth redirect still points to old bundle. |
| **ConfirmEmail route** | `src/pages/auth/ConfirmEmail.jsx` | Likely **non-functional** for real users unless replaced with Supabase magic-link / `verifyOtp` flow. |
| **`send-all-templates.js`** | repo root | Dev utility; requires **service role** in `.env` — **never** commit secrets. |
| **`cleanup.sh`** | repo root | Review before production use (not audited here). |

---

## 5. Production / security pointers (short)

- Full checklist: **`md/security.md`** (updated for `send-email` auth, OTP path, payment reconcile, `AdminGuard`, Resend logging).
- **Deploy** migrations: `20260511_auth_email_exists_rpc.sql`, `20260512_platform_resend_email_events.sql`, and redeploy **`send-email`**, **`verify-payment-and-activate`**, **`request-otp`**.
- **Resend quota:** Admin → **Resend usage** tab; adjust `monthly_limit` in `get_admin_resend_email_stats` if your plan is not 3000/month.
- **Headers / WAF / CSP:** Still hosting-layer work (not in repo).

---

## 6. Schema & API documentation

- **`md/DATABASE_SCHEMA.md`** — Tables and relationships (high level).  
- **`md/API.md`** — Edge Functions and important RPCs.

---

## 7. Documentation set status

| File | Status (May 12, 2026) |
|------|----------------------|
| `md/security.md` | Updated for latest auth, payments, admin, Resend. |
| `md/audit.md` | This file (new). |
| `md/DATABASE_SCHEMA.md` | New. |
| `md/API.md` | New. |
| `md/FEATURES_FLOW.md` | Should bump “last updated” and template count → **10**; verify trial limits vs `enforce_invoice_limit` trigger. |
| `md/IMPLEMENTATION_STATUS.md` | Marketing-heavy (“100% complete”); **tone down** over time; add Resend admin + payment fixes. |
| `md/Technical_Documentation.md` | Add cross-links to new docs; refresh “Email” row (Resend + Gmail + Edge Functions). |

---

*This audit is based on static review of the repository; production Supabase dashboard settings or uncommitted env may differ.*
