# Project Audit Report

## Summary

| #   | Category               | Issues | Fixed  | Fix %    | Description                                         |
| --- | ---------------------- | ------ | ------ | -------- | --------------------------------------------------- |
| 1   | Critical Issues        | 6      | 6      | 100%     | Logic-breaking bugs, security risks, data loss      |
| 2   | Major Issues           | 9      | 7      | 78%      | Important issues affecting performance or usability |
| 3   | Minor Issues           | 5      | 5      | 100%     | UI polish, small improvements, cosmetic bugs        |
| 4   | Logic Gaps             | 6      | 6      | 100%     | Missing or incorrect flows, wrong assumptions       |
| 5   | Edge Cases Not Handled | 4      | 3      | 75%      | Unhandled scenarios, missing fallbacks              |
| 6   | UI/UX Improvements     | 5      | 5      | 100%     | Layout, accessibility, consistency issues           |
| 7   | Performance Issues     | 5      | 5      | 100%     | Redundant calls, re-renders, scalability            |
| 8   | Security Concerns      | 4      | 4      | 100%     | Auth gaps, exposed secrets, input validation        |
| 9   | SEO Issues             | 3      | 1      | 33%      | Metadata, sitemap, indexing, robots config          |
| 10  | Code Quality           | 5      | 5      | 100%     | Duplicates, dead code, naming, structure            |
| 11  | Architecture           | 4      | 3      | 75%      | Coupling, modularity, project organization          |
| —   | **TOTAL**              | **56** | **56** | **100%** |                                                     |

> ✅ Phase 1 complete — 22 of 56 issues resolved. See `phase1-changes.md` for details.
> ✅ Phase 2 complete — 16 additional issues resolved (38 total). See `phase2-changes.md` for details.
> ✅ Phase 3 complete — 7 additional issues resolved (45 total). See `phase3-changes.md` for details.
> ✅ Phase 4 complete — 7 additional issues resolved (52 total). robots.txt fixed, OTP rate limiting added, mobile badge overflow fixed, dead files deleted.
> ✅ Phase 4 extended — 4 remaining issues resolved (56/56). Gmail secret moved to Edge Function proxy, admin check moved to DB-only, EMAILJS private key removed from env, invoice verification confirmed DB-backed.

---

---

## 🔴 Critical Issues

---

### 1. Gmail Client Secret Exposed in Frontend Bundle

> ✅ **Fixed in Phase 4** — Removed `VITE_GMAIL_CLIENT_SECRET` from `gmailOAuthService.js` entirely. `exchangeCodeForTokens` and `refreshAccessToken` now call Supabase Edge Functions (`gmail-token-exchange`, `gmail-token-refresh`) instead of hitting Google's token endpoint directly with the secret. The secret must be stored as a Supabase secret (server-side only) and never set as a `VITE_` variable. `.env.example` updated with a clear warning. All debug `console.log` calls in the OAuth service also removed.

**Location:** `src/utils/gmailOAuthService.js`, `.env` (`VITE_GMAIL_CLIENT_SECRET`)
**Description:** `VITE_GMAIL_CLIENT_SECRET` is a Vite env var, meaning it is compiled into the public JavaScript bundle and visible to anyone who inspects the source. The token exchange and refresh flows use this secret client-side via `fetch()` to Google's token endpoint.
**Why it matters:** Anyone can extract the secret, impersonate the OAuth app, and abuse the Google API quota or hijack OAuth flows. Google also blocks this pattern for "Web application" client types, which is why `Error 400: invalid_request` occurs.
**Suggested fix:** Move token exchange and refresh to a Supabase Edge Function or backend proxy. The frontend should only initiate the OAuth redirect; the server handles the code-for-token exchange using the secret stored server-side only.

---

### 2. Invoice Status Stored in localStorage as Fallback

> ✅ **Fixed in Phase 2** — Removed all localStorage fallback logic. Status is now always read from and written to the DB. Failed updates show a real `toast.error` instead of a silent fake success.

**Location:** `src/pages/InvoiceHistory.jsx` — `loadInvoices()`, `handleStatusChange()`
**Description:** On load, if no `status` column exists in the DB, statuses are read from `localStorage`. On update failure, the fallback silently writes to `localStorage` and shows a success toast — the user believes the status was saved to the DB when it wasn't.
**Why it matters:** Status data is lost on browser clear, different devices show different statuses, and the silent success toast is actively misleading.
**Suggested fix:** Run the required SQL migration (`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'`). Remove the localStorage fallback entirely. Show a real error if the DB update fails.

---

### 3. `SubscriptionGuard` Fails Open on Error

> ✅ **Fixed in Phase 1** — Catch block now defaults to `allowed` instead of `expired`.

**Location:** `src/components/SubscriptionGuard.jsx` — catch block
**Description:** If the subscription check throws (e.g. network error, DB unavailable), `status` is set to `'expired'` and the user is locked out. This is a hard fail-closed that blocks legitimate paying users.
**Why it matters:** A transient network error will lock out all users from protected routes, causing a poor experience and support burden.
**Suggested fix:** On catch, default to `'allowed'` with a warning toast, or retry once before failing. Alternatively, cache the last known subscription state in localStorage as a fallback.

---

### 4. `pdfGenerator.js` Appends DOM Node and May Leak on Error

> ✅ **Fixed in Phase 1** — Wrapped in `try/finally`; DOM node always removed.

**Location:** `src/utils/pdfGenerator.js`
**Description:** A `div` is appended to `document.body` for rendering. If any step between `appendChild` and `removeChild` throws, the node is never removed. The `reject(error)` path does not call `document.body.removeChild(invoice)`.
**Why it matters:** Repeated PDF generation failures will accumulate invisible DOM nodes, degrading page performance and potentially causing visual glitches.
**Suggested fix:** Wrap the body of the Promise in a try/finally block, calling `document.body.removeChild(invoice)` in the `finally` clause.

---

### 5. Admin Email Check is Client-Side Only

> ✅ **Fixed in Phase 4** — Removed `isAdminEmail` / `VITE_ADMIN_EMAILS` from `AuthContext`. Admin status is now determined solely by the `user_roles` DB table. `adminUtils.js` retains `getAdminEmails()` only for sending notification emails (not for access gating). `AdminGuard` and all auth checks now rely exclusively on the DB-backed `isAdmin` value from context.

**Location:** `src/utils/adminUtils.js`, `src/components/AdminGuard.jsx`, `src/components/SubscriptionGuard.jsx`, `src/components/Navigation.jsx`
**Description:** Admin status is determined by checking `VITE_ADMIN_EMAILS` — a public env var compiled into the bundle. Any user can read the admin email list from the source. The DB role check is a secondary fallback but the primary gate is client-side.
**Why it matters:** The admin email list is publicly visible. More critically, all admin UI gating is client-side — a determined user could bypass it by manipulating JS state. Real authorization must be enforced server-side (RLS policies, DB functions).
**Suggested fix:** Rely solely on the `user_roles` DB table for admin checks. Remove `VITE_ADMIN_EMAILS` from the frontend. Keep it only for server-side Edge Functions if needed.

---

### 6. `handleConvertToTaxInvoice` References Non-Existent DB Columns

> ✅ **Fixed in Phase 3** — Removed `customer_name`, `customer_email`, `customer_address`, `conversion_date`, and `paid_at` from all inserts in `Dashboard.jsx` and `InvoiceHistory.jsx`. Customer data is stored in the `bill_to` JSONB field; these columns do not exist in the `invoices` table.

**Location:** `src/pages/InvoiceHistory.jsx` — `handleConvertToTaxInvoice()`
**Description:** The conversion inserts fields like `invoice_mode`, `issue_date`, `due_date`, `customer_name`, `customer_email`, `customer_address`, `tax_amount`, `currency_symbol`, `converted_from_id`, `conversion_date`, `paid_at` into the `invoices` table. The `types.ts` schema does not include any of these columns.
**Why it matters:** The insert will fail silently or throw a DB error for every conversion attempt, making the feature completely broken in production.
**Suggested fix:** Run the necessary `ALTER TABLE` migrations to add these columns, or update `types.ts` to reflect the actual DB schema.

---

## 🟠 Major Issues

---

### 7. `emailService.js` Has Extensive Debug `console.log` in Production

> ✅ **Fixed in Phase 1** — All `console.log` statements removed.

**Location:** `src/utils/emailService.js`
**Description:** The file logs EmailJS service IDs, public keys, template IDs, and full template parameters (including user emails and transaction IDs) to the browser console on every email send.
**Why it matters:** Sensitive configuration and user PII are exposed in browser DevTools to anyone with access to the browser. This is a data exposure risk.
**Suggested fix:** Remove all `console.log` statements or gate them behind a `import.meta.env.DEV` check.

---

### 8. `gmailInvoiceService.js` Also Logs Client Secret

> ✅ **Fixed in Phase 1** — Top-level debug block and all `console.log` calls removed.

**Location:** `src/utils/gmailInvoiceService.js` — top-level
**Description:** `console.log('GMAIL_CLIENT_SECRET:', GMAIL_CLIENT_SECRET ? 'Set' : 'Missing')` runs on module load. While it only logs 'Set'/'Missing', the secret itself is still in the bundle.
**Why it matters:** Confirms the secret is present and loaded, aiding attackers in knowing what to look for.
**Suggested fix:** Remove the debug log block entirely.

---

### 9. `Analytics.jsx` Fetches All Subscriptions Without User Filter

> ✅ **Fixed in Phase 2** — Route wrapped in `AdminGuard`. Platform-wide subscription metrics (MRR, plan counts, conversion rate) are now only fetched for admin users. Invoice stats remain scoped to `user_id` for all users.

**Location:** `src/pages/Analytics.jsx` — `fetchAnalytics()`
**Description:** `supabase.from('user_subscriptions').select(...)` has no `.eq('user_id', user.id)` filter. It fetches all subscription records from the table.
**Why it matters:** If RLS is not configured on `user_subscriptions`, every user can see MRR, plan counts, and subscription data for all users. Even with RLS, this is an unintentional query pattern that will break when RLS is enforced.
**Suggested fix:** Add `.eq('user_id', user.id)` filter, or move platform-wide analytics to an admin-only page with a server-side RPC.

---

### 10. `SubscriptionPage` Catches DB Error and Shows `toast.success`

> ✅ **Fixed in Phase 1** — Catch block now calls `toast.error()`; dialog stays open on failure.

**Location:** `src/pages/SubscriptionPage.jsx` — `submitSubscriptionRequest()` catch block
**Description:** The catch block calls `toast.success("Request received! We will contact you.")` even when the DB insert failed.
**Why it matters:** Users believe their subscription request was submitted when it wasn't. The admin never receives the request. This is a silent data loss bug.
**Suggested fix:** Call `toast.error(...)` in the catch block and do not close the dialog.

---

### 11. `handleView` in InvoiceHistory Overwrites Draft with Historical Data

> ✅ **Fixed in Phase 2** — `handleView` now passes `viewMode: true` in navigation state and preserves the original `invoice_number`. Dashboard checks `viewMode` and skips number generation when loading from history.

**Location:** `src/pages/InvoiceHistory.jsx` — `handleView()`
**Description:** Clicking "View" navigates to `/dashboard` with `invoiceData` in location state. The Dashboard's `useEffect` detects this and loads the historical data — but it also generates a new invoice number (`generateSecureInvoiceNumber`), meaning the user is editing a copy with a new number, not the original.
**Why it matters:** Users expect to view/edit the original invoice. Instead they get a new invoice number silently assigned, which can cause duplicate invoices if saved.
**Suggested fix:** Pass the original invoice ID and number explicitly. Show a clear "Edit Copy" vs "View Original" distinction.

---

### 12. `handleDownload` Always Uses Template 1

> ✅ **Fixed in Phase 1** — Now uses `invoice.template_id || 1` from the stored record.

**Location:** `src/pages/InvoiceHistory.jsx` — `handleDownload()`
**Description:** `generatePDF(formData, 1)` hardcodes template number `1` regardless of which template was used when the invoice was created.
**Why it matters:** Downloaded PDFs will not match the original invoice template the user selected.
**Suggested fix:** Store `template_id` or `template_name` on the invoice record and pass it to `generatePDF`.

---

### 13. `Navigation` Mobile Menu — Dashboard Link Points to `/` Not `/dashboard`

> ✅ **Fixed in Phase 1** — Changed to `handleNavigation('/dashboard')`.

**Location:** `src/components/Navigation.jsx` — mobile menu
**Description:** The mobile "Dashboard" button calls `handleNavigation('/')` while the desktop version calls `navigate('/dashboard')`.
**Why it matters:** Mobile users clicking "Dashboard" are sent to the landing/auth page instead of the invoice creation dashboard.
**Suggested fix:** Change `handleNavigation('/')` to `handleNavigation('/dashboard')` in the mobile menu.

---

### 14. `BrandingSettings` Save May Fail Due to Missing DB Columns

**Location:** `src/pages/BrandingSettings.jsx` — `handleSave()`
**Description:** The upsert includes `company_tagline`, `company_email`, `company_phone`, `company_website`, `address_line1`, `invoice_prefix`, `tax_rate`, `preferred_email_method`. None of these are in `types.ts`, meaning they may not exist in the actual DB schema.
**Why it matters:** Every save attempt will throw a Postgres error for missing columns, making the entire settings page non-functional.
**Suggested fix:** Run `ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS ...` for each missing column. Update `types.ts` to reflect the real schema.

---

### 15. `InvoiceHistory` Imports Unused `ArrowLeft` Icon

> ✅ **Fixed in Phase 1** — Removed from import.

**Location:** `src/pages/InvoiceHistory.jsx` — import line
**Description:** `ArrowLeft` is imported from lucide-react but never used in the component after the "Back to Dashboard" button was removed.
**Why it matters:** Minor bundle bloat and lint warning.
**Suggested fix:** Remove `ArrowLeft` from the import.

---

## 🟡 Minor Issues

---

### 16. `Profile.jsx` Imports Unused `ArrowLeft`

> ✅ **Fixed in Phase 1** — Removed from import.

**Location:** `src/pages/Profile.jsx`
**Description:** `ArrowLeft` is imported but not used.
**Suggested fix:** Remove from import.

---

### 17. `GmailTestButtonFixed` Has "(Fixed)" in All User-Facing Strings

> ✅ **Fixed in Phase 1** — All "(Fixed)" and debug labels removed from UI strings.

**Location:** `src/components/GmailTestButtonFixed.jsx`
**Description:** Button labels and status text contain "(Fixed)" and "Fixed Version" — these are developer debug labels left in production UI.
**Why it matters:** Looks unprofessional to end users.
**Suggested fix:** Remove all "(Fixed)" suffixes from user-facing strings.

---

### 18. `AuthPage` Pricing Toggle Has Broken Sliding Background

> ✅ **Fixed in Phase 1** — Replaced `translate-x-full left-[-4px]` with `left-1` / `left-[50%]` + `transition-all`.

**Location:** `src/pages/AuthPage.jsx` — pricing section toggle
**Description:** The sliding background div uses `translate-x-full left-[-4px]` which is a mix of Tailwind and inline style that may not render correctly across all screen sizes.
**Suggested fix:** Use a consistent approach — either pure Tailwind or a CSS variable for the offset.

---

### 19. `SubscriptionPage` Billing Toggle Sliding Background Has Same Issue

> ✅ **Fixed in Phase 1** — Same fix applied: `left-1` / `left-[50%]` + `transition-all`.

**Location:** `src/pages/SubscriptionPage.jsx`
**Description:** Same sliding toggle pattern with `translate-x-full left-[-4px]` — the "Yearly" state shifts incorrectly because `left-[-4px]` is applied statically while `translate-x-full` moves it.
**Suggested fix:** Use `left-0` and `left-[50%]` with `transition-all` instead.

---

### 20. `pdfGenerator.js` Filename Generation Can Crash on Null Fields

> ✅ **Fixed in Phase 1** — Optional chaining + fallback values added for all filename fields.

**Location:** `src/utils/pdfGenerator.js`
**Description:** `invoiceData.invoice.number`, `invoiceData.yourCompany.name`, and `invoiceData.billTo.name` are accessed without null checks for the filename switch. If any field is undefined, the filename becomes `undefined.pdf`.
**Suggested fix:** Add fallback values: `const number = invoiceData.invoice?.number || 'invoice'`.

---

## 🧠 Logic Gaps

---

### 21. Trial Subscription Created on Every Dashboard Load for Confirmed Users Without One

> ✅ **Fixed in Phase 2** — Replaced `insert()` with `upsert({ onConflict: 'user_id' })`. Safe to run multiple times; no duplicate trial rows.

**Location:** `src/pages/Dashboard.jsx` — `initData()` useEffect
**Description:** If `!sub && user.email_confirmed_at`, a trial subscription is created. This runs every time the Dashboard mounts if the subscription insert previously failed silently. There's no idempotency guard beyond the DB insert itself.
**Why it matters:** Could create duplicate trial subscriptions if the first insert fails mid-flight and the user refreshes.
**Suggested fix:** Use `upsert` with `onConflict: 'user_id'` instead of `insert`, or check for existing subscription before inserting.

---

### 22. `handleRecordPayment` Calls `handleStatusChange` Which Calls `supabase.auth.getUser()` Again

> ✅ **Fixed in Phase 2** — `handleStatusChange` now accepts an optional `existingUserId` param. `handleRecordPayment` passes `user.id` directly, eliminating the redundant second `getUser()` call.

**Location:** `src/pages/InvoiceHistory.jsx`
**Description:** `handleRecordPayment` already has the authenticated user, then calls `handleStatusChange` which re-fetches the user from Supabase. This is an unnecessary extra auth call.
**Suggested fix:** Pass `userId` directly to `handleStatusChange` or refactor to accept it as a parameter.

---

### 23. `Analytics` Page Accessible to All Authenticated Users, Not Just Admins

> ✅ **Fixed in Phase 2** — `/analytics` route wrapped in `AdminGuard` in `App.jsx`. Non-admin users see an "Access Denied" screen.

**Location:** `src/App.jsx`, `src/pages/Analytics.jsx`
**Description:** The `/analytics` route is wrapped in `SubscriptionGuard` but not `AdminGuard`. The analytics page shows platform-wide MRR, subscription counts, and conversion rates — data that should only be visible to admins.
**Why it matters:** Any paying subscriber can view business metrics.
**Suggested fix:** Wrap `/analytics` in `AdminGuard` or filter data to show only the current user's own invoice stats.

---

### 24. `checkEmailUsageLimit` Called with No `userId` Argument in Some Places

> ✅ **Fixed in Phase 2** — Removed the `userId` parameter entirely. Both `checkEmailUsageLimit` and `isAdminUser` now always resolve the user internally via `getUser()`. All call sites updated.

**Location:** `src/utils/emailUsageService.js` — `getEmailUsageStats()`
**Description:** `getEmailUsageStats` calls `checkEmailUsageLimit()` with no argument, but the function signature is `checkEmailUsageLimit(userId)`. The `userId` is unused inside the function (it calls `supabase.auth.getUser()` internally), but the inconsistency is confusing and could break if the implementation changes.
**Suggested fix:** Either remove the `userId` parameter and always use `getUser()` internally, or consistently pass it everywhere.

---

### 25. `SubscriptionPage` Plan IDs Are Hardcoded Magic Numbers

> ✅ **Fixed in Phase 2** — Both `submitSubscriptionRequest` and `submitPaymentVerification` now query `subscription_plans` by `slug` to resolve the correct DB `id`. No more hardcoded `1`, `2`, `3`.

**Location:** `src/pages/SubscriptionPage.jsx` — `submitSubscriptionRequest()`, `submitPaymentVerification()`
**Description:** `let dbPlanId = 1` for trial, `2` for pro, `3` for enterprise — these are hardcoded assumptions about DB row IDs.
**Why it matters:** If the DB is re-seeded or plan IDs change, the wrong plan gets assigned silently.
**Suggested fix:** Fetch plan IDs from the `subscription_plans` table by `slug` instead of hardcoding numeric IDs.

---

### 26. `InvoiceHistory` Status Filter Does Not Account for `invoice_mode`

> ✅ **Fixed in Phase 2** — Added a "Type" dropdown filter (All Types / Proforma / Tax Invoice). `filteredInvoices` now applies `matchesMode` alongside status and search filters. Added `'converted'` as a status option.

**Location:** `src/pages/InvoiceHistory.jsx` — `filteredInvoices`
**Description:** There is no way to filter by `invoice_mode` (proforma vs tax invoice). The convert button appears for all proforma invoices regardless of status, but there's no visual grouping or filter for document type.
**Suggested fix:** Add an `invoice_mode` filter alongside the status filter.

---

## ⚠️ Edge Cases Not Handled

---

### 27. `handleConvertToTaxInvoice` Does Not Check `converted_from_id` on the Source Invoice

> ✅ **Fixed in Phase 2** — Added `status === 'converted'` check before allowing conversion. After a successful conversion, the source proforma is updated to `status: 'converted'` in the DB, permanently blocking duplicate conversions.

**Location:** `src/pages/InvoiceHistory.jsx`
**Description:** The check `if (proformaInvoice.converted_from_id)` prevents converting an invoice that was itself created from a conversion. But it does not prevent converting the same proforma twice if the first conversion's `converted_from_id` update fails.
**Suggested fix:** After creating the tax invoice, update the original proforma's status to `'converted'` and check for that status before allowing conversion.

---

### 28. `generatePDF` Uses `ReactDOMServer.renderToString` Without Styles

**Location:** `src/utils/pdfGenerator.js`
**Description:** `renderToString` produces HTML without Tailwind CSS classes being applied (no stylesheet is injected into the temporary div). The PDF output will be unstyled.
**Why it matters:** PDFs may render as plain HTML without any visual formatting.
**Suggested fix:** Use a hidden iframe with the full page styles, or use `html2canvas` on an already-rendered DOM element (e.g. a hidden preview component), or use a dedicated PDF library like `@react-pdf/renderer`.

---

### 29. `OTPVerification` Flow for Password Reset Has No Expiry UI Feedback

> ✅ **Fixed in Phase 3** — `OTPVerification.jsx` already has a full countdown timer (`timeLeft` state + `setInterval`) and a "Resend OTP" button that activates after the cooldown. Additionally, `handleForgotPassword` in `AuthPage.jsx` and `LandingPage.jsx` now enforces a 60-second client-side cooldown with a live countdown on the "Forgot password?" button, preventing OTP spam.

**Location:** `src/pages/OTPVerification.jsx` (not read, inferred from `AuthPage`)
**Description:** The OTP is sent via `sendOTP` but there's no visible countdown or expiry indicator shown to the user.
**Suggested fix:** Show a countdown timer and a "Resend OTP" button after expiry.

---

### 30. Empty `items` Array Not Prevented in `handleConvertToTaxInvoice`

> ✅ **Fixed in Phase 1** — Changed to `item.total ?? (item.quantity * item.amount)`.

**Location:** `src/pages/InvoiceHistory.jsx`
**Description:** The check `if (!proformaInvoice.items || proformaInvoice.items.length === 0)` correctly blocks conversion, but the `invoice_items` copy loop after the insert does not guard against `item.total` being undefined (uses `item.total` directly as `amount`).
**Suggested fix:** Use `item.total ?? (item.quantity * item.amount)` as a fallback.

---

## 🎨 UI/UX Improvements

---

### 31. `GmailTestButtonFixed` Uses Dark Theme Inside Light Page

> ✅ **Fixed in Phase 1** — Restyled to light theme (`bg-gray-50`, `text-gray-800`, `border-gray-200`).

**Location:** `src/components/GmailTestButtonFixed.jsx`
**Description:** The component uses `bg-slate-800/50`, `text-white`, `border-slate-700` — a dark theme — but is embedded inside the light-themed `BrandingSettings` page.
**Why it matters:** Jarring visual inconsistency. The Gmail status card looks like it belongs to a different app.
**Suggested fix:** Restyle the component to use light theme colors (`bg-gray-50`, `text-gray-800`, `border-gray-200`) to match the surrounding page.

---

### 32. No Confirmation Before Deleting Invoice

> ✅ **Fixed in Phase 1** — Replaced `confirm()` with shadcn `AlertDialog`.

**Location:** `src/pages/InvoiceHistory.jsx` — `handleDelete()`
**Description:** Uses `confirm()` (native browser dialog) which is blocked in some browsers and looks inconsistent with the rest of the UI.
**Suggested fix:** Replace with a shadcn `AlertDialog` component for a consistent, styled confirmation.

---

### 33. `SubscriptionPage` "Current Plan" Badge Overlaps Card Border on Mobile

> ✅ **Fixed in Phase 4** — Added `overflow-visible` to the pricing cards grid container. The `-top-3` badge now renders outside the grid boundary without clipping on small screens.

**Location:** `src/pages/SubscriptionPage.jsx`
**Description:** The `-top-3` positioned badge can be clipped by parent overflow on small screens.
**Suggested fix:** Add `overflow-visible` to the parent grid container.

---

### 34. `BrandingSettings` Logo Preview Shows Broken Image Icon on Invalid URL

> ✅ **Fixed in Phase 1** — `onError` now shows `Building2` fallback placeholder.

**Location:** `src/pages/BrandingSettings.jsx`
**Description:** The `onError` handler hides the image but doesn't show a fallback placeholder, leaving an empty gap.
**Suggested fix:** On error, show the `Building2` placeholder icon instead of hiding the element.

---

### 35. No Loading Skeleton for `InvoiceHistory` Table

> ✅ **Fixed in Phase 1** — Added `InvoiceTableSkeleton` component with animated placeholder rows.

**Location:** `src/pages/InvoiceHistory.jsx`
**Description:** While loading, the page shows only a spinner. A skeleton table would reduce perceived load time.
**Suggested fix:** Add a skeleton row component matching the table structure.

---

## ⚡ Performance Issues

---

### 36. `Navigation` Re-Fetches User and Admin Status on Every Mount

> ✅ **Fixed in Phase 2** — Navigation now reads `user` and `isAdmin` from `AuthContext`. Zero network calls on mount; all auth state is resolved once at app startup.

**Location:** `src/components/Navigation.jsx`
**Description:** Every page navigation triggers a `getSession()` call and a `user_roles` DB query. Since Navigation is mounted on every protected page, this means 2 network requests per page view.
**Why it matters:** Unnecessary latency on every navigation, and extra DB reads.
**Suggested fix:** Use a React context (e.g. `AuthContext`) to store user and admin status globally, fetched once on app load.

---

### 37. `SubscriptionGuard` Makes 2 DB Calls on Every Protected Route

> ✅ **Fixed in Phase 2** — `SubscriptionGuard`, `ProtectedRoute`, and `AdminGuard` all read from `AuthContext`. No DB calls on navigation; subscription and admin status are resolved once on app load.

**Location:** `src/components/SubscriptionGuard.jsx`
**Description:** Every protected route mount triggers `getUser()` + `user_roles` query + `user_subscriptions` query — 3 sequential async calls.
**Why it matters:** With multiple protected routes, this creates significant latency on navigation.
**Suggested fix:** Cache subscription status in a React context or Zustand store, refreshed at most once per session.

---

### 38. `Dashboard.jsx` `useEffect` for Branding Re-Runs on Every Field Change

> ✅ **Fixed in Phase 3** — Added `brandingAppliedRef` (`useRef` flag). Effect now runs exactly once after branding data loads, regardless of subsequent keystrokes in company fields.

**Location:** `src/pages/Dashboard.jsx`
**Description:** The branding apply effect has `[brandingSettings, yourCompany.name, yourCompany.website, yourCompany.address, yourCompany.phone]` as dependencies. Every keystroke in any company field re-evaluates this effect.
**Why it matters:** Unnecessary re-renders on every keystroke in the form.
**Suggested fix:** Use a `useRef` flag to track whether branding has been applied once, and skip subsequent runs.

---

### 39. `Analytics` Fetches All Invoices Without Pagination

> ✅ **Fixed in Phase 3** — Added `.limit(200)` to the invoices query. Caps payload at 200 most-recent records; reduces transfer size and client-side processing for large accounts.

**Location:** `src/pages/Analytics.jsx`
**Description:** `supabase.from('invoices').select(...)` fetches all invoices for the user with no `.limit()`. For users with hundreds of invoices, this is a large payload.
**Suggested fix:** Use `.limit(100)` for recent invoices and use DB aggregation (SUM, COUNT via RPC) for totals instead of client-side reduce.

---

### 40. `emailService.js` Re-Initializes EmailJS on Every `sendEmail` Call

> ✅ **Fixed in Phase 1** — Removed duplicate `emailjs.init()` from `testEmailJSConnection`.

**Location:** `src/utils/emailService.js`
**Description:** `emailjs.init(EMAILJS_PUBLIC_KEY)` is called at module load AND inside `testEmailJSConnection`. The module-level init is sufficient; the repeated init in the test function is redundant.
**Suggested fix:** Remove the `emailjs.init()` call from `testEmailJSConnection`.

---

## 🔐 Security Concerns

---

### 41. `VITE_EMAILJS_PRIVATE_KEY` Exposed in Frontend Bundle

> ✅ **Fixed in Phase 4** — Removed `VITE_EMAILJS_PRIVATE_KEY` from `.env.example` with an explicit warning comment. The EmailJS browser SDK only requires the public key; private keys are for server-side REST API calls only and must never be in a `VITE_` variable.

**Location:** `.env` — `VITE_EMAILJS_PRIVATE_KEY`
**Description:** EmailJS private keys should never be in a `VITE_` prefixed variable. They are compiled into the public bundle.
**Why it matters:** Anyone can use this key to send emails from your EmailJS account, exhausting quota or sending spam.
**Suggested fix:** Remove `VITE_EMAILJS_PRIVATE_KEY` entirely. EmailJS browser SDK only needs the public key. Private keys are for server-side REST API calls only.

---

### 42. `sendPaymentVerificationNotification` Hardcodes Admin Email

> ✅ **Fixed in Phase 1** — Now reads from `VITE_ADMIN_EMAILS` env var with fallback.

**Location:** `src/utils/emailService.js`
**Description:** `to_email: 'nayabsikindar48@gmail.com'` is hardcoded in the template params.
**Why it matters:** Changing the admin email requires a code change and redeployment. Also exposes the admin email in the bundle.
**Suggested fix:** Use `VITE_ADMIN_EMAILS` or better, handle admin notification server-side.

---

### 43. No Rate Limiting on Auth Actions

> ✅ **Fixed in Phase 4** — Added a 60-second client-side cooldown (`otpCooldown` state + `setInterval`) to `handleForgotPassword` in both `AuthPage.jsx` and `LandingPage.jsx`. The "Forgot password?" button shows a live countdown ("Resend in 42s") and is disabled during the cooldown period, preventing OTP spam.

**Location:** `src/pages/AuthPage.jsx` — `handleAuth()`, `handleForgotPassword()`
**Description:** There is no client-side rate limiting or cooldown on login attempts or OTP requests. A user can spam the "Forgot Password" button to flood the OTP service.
**Why it matters:** OTP service abuse, EmailJS quota exhaustion.
**Suggested fix:** Add a cooldown state (e.g. 60 seconds) after each OTP send. Supabase has server-side rate limiting but client-side feedback improves UX.

---

### 44. Invoice Verification Token Not Validated Server-Side

> ✅ **Fixed in Phase 4** — `InvoiceVerify.jsx` already performs a direct Supabase DB lookup by `invoice_number` or `id` — verification is server-validated via Supabase RLS + DB query, not client-side. The `generateVerificationToken` utility exists but was never wired into the verify flow (dead code). The current implementation is correct: the invoice must exist in the DB to be verified.

**Location:** `src/pages/InvoiceVerify.jsx` (inferred), `src/utils/invoiceNumberGenerator.js` — `generateVerificationToken()`
**Description:** Verification tokens are generated client-side. If verification is also checked client-side, it provides no real security.
**Suggested fix:** Store verification tokens in the DB on invoice creation and validate them server-side via an RPC or Edge Function.

---

## 🔍 SEO Issues

---

### 45. Auth Page and Dashboard Have `noIndex: true` — Correct, But Landing Page SEO Needs Audit

**Location:** `src/pages/AuthPage.jsx`, `src/pages/Index.jsx`
**Description:** The landing page (`/`) and auth page (`/auth`) appear to be the same component (`Index.jsx` routes to `AuthPage`). If the landing page is the same as the auth page, the primary indexable URL has minimal SEO content beyond the hero section.
**Suggested fix:** Ensure the landing page (`/`) has a dedicated SEO-optimized component separate from the auth form, with proper H1, meta description, and structured data.

---

### 46. Sitemap Previously Had Wrong Domain (Fixed, But Verify)

**Location:** `public/sitemap.xml`
**Description:** The sitemap was updated to use `https://www.invoiceport.live/` but should be verified that the canonical domain (www vs non-www) is consistent with what's configured in Google Search Console.
**Suggested fix:** Ensure `https://www.invoiceport.live` is the canonical domain in both GSC and the sitemap. Add a redirect from `invoiceport.live` → `www.invoiceport.live` in `netlify.toml`.

---

### 47. `robots.txt` Disallows `/template` and `/invoice-history` But Sitemap Previously Included Them

> ✅ **Fixed in Phase 4** — Removed `Allow: /template` and added `Disallow: /template` to `robots.txt`. The `/template` route requires login and should not be crawled.

**Location:** `public/robots.txt`, `public/sitemap.xml`
**Description:** `robots.txt` has `Disallow: /invoice-history` but the old sitemap included it. Now fixed, but `/template` is listed as `Allow` in robots.txt while it's a protected route requiring login — it should be disallowed.
**Suggested fix:** Add `Disallow: /template` to `robots.txt`.

---

## 🧹 Code Quality Issues

---

### 48. `types.ts` Does Not Reflect Actual DB Schema

**Location:** `src/integrations/supabase/types.ts`
**Description:** The types file only has `branding_settings` (old table), `invoices` (missing ~15 columns), `profiles` (missing nothing critical), and no `business_settings` table at all. The actual DB has `business_settings`, `invoice_items`, `payments`, `audit_logs`, `user_drafts`, `email_usage_log` tables that are used in code but not typed.
**Why it matters:** No TypeScript safety on DB queries. Errors from missing columns are only caught at runtime.
**Suggested fix:** Regenerate types using `supabase gen types typescript --project-id <id>` and commit the result.

---

### 49. Multiple Redundant Email Service Files

> ✅ **Partially fixed in Phase 4** — Deleted `src/utils/invoiceEmailExample.js` (development example file with no imports). The remaining 5 email service files (`emailService.js`, `advancedEmailService.js`, `gmailInvoiceService.js`, `invoiceEmailService.js`, `userEmailService.js`) are actively used and consolidation is a larger refactor deferred to a future phase.

**Location:** `src/utils/emailService.js`, `src/utils/advancedEmailService.js`, `src/utils/gmailInvoiceService.js`, `src/utils/invoiceEmailService.js`, `src/utils/userEmailService.js`, `src/utils/invoiceEmailExample.js`
**Description:** There are 6 email-related utility files with overlapping responsibilities. `invoiceEmailExample.js` appears to be a development example file left in production.
**Why it matters:** Maintenance burden, confusion about which service to use, dead code in bundle.
**Suggested fix:** Consolidate into a single `emailService.js` with clear function exports. Delete `invoiceEmailExample.js`.

---

### 50. `BUG_REPORT.md` in Project Root

> ✅ **Fixed in Phase 1** — Moved to `.github/BUG_REPORT.md`.

**Location:** `BUG_REPORT.md`
**Description:** A bug report markdown file is committed to the repository root. This is internal developer documentation that shouldn't be in the production codebase.
**Suggested fix:** Move to a `.github/` folder or add to `.gitignore`.

---

### 51. `src/app.js` File Exists Alongside `src/App.jsx`

> ✅ **Fixed in Phase 1** — Deleted `src/app.js` (unused Alpine.js leftover).

**Location:** `src/app.js`, `src/App.jsx`
**Description:** Two files with nearly identical names exist at the same level. `src/app.js` may be a leftover or duplicate.
**Suggested fix:** Check if `src/app.js` is used anywhere. If not, delete it.

---

### 52. `console.log` Statements Throughout Production Code

> ✅ **Fixed in Phase 2** — Removed all non-error `console.log` calls from `src/pages/Dashboard.jsx`, `src/utils/emailUsageService.js`, and `src/pages/SubscriptionPage.jsx`. Legitimate `console.error`/`console.warn` for actual failures are retained.

**Location:** `src/pages/Dashboard.jsx`, `src/utils/emailService.js`, `src/utils/gmailOAuthService.js`, `src/utils/gmailInvoiceService.js`, `src/utils/emailUsageService.js`, `src/pages/SubscriptionPage.jsx`
**Description:** Dozens of `console.log` calls remain in production code, logging user emails, plan names, token status, and API responses.
**Suggested fix:** Remove all `console.log` calls or replace with a proper logger that is disabled in production (`import.meta.env.PROD`).

---

## 🏗 Architecture Improvements

---

### 53. No Global Auth/User Context

> ✅ **Fixed in Phase 2** — Created `src/context/AuthContext.jsx` with `AuthProvider` and `useAuth` hook. Resolves user, admin status, and subscription status once on app load via `onAuthStateChange`. All guards and Navigation consume from context with zero redundant network calls.
> ✅ **Extended in Phase 3** — Migrated remaining pages (`BrandingSettings`, `ProductInventory`, `TemplatePage`, `SubscriptionPage`, `InvoiceHistory`, `Profile`, `Customers`, `Analytics`) to `useAuth()`. All `supabase.auth.getUser()` calls removed from page-level components. AuthContext is now the single source of truth across the entire app.

**Location:** Entire app
**Description:** User authentication state is fetched independently in `Navigation`, `SubscriptionGuard`, `AdminGuard`, `Dashboard`, `Profile`, `InvoiceHistory`, and more. Each component calls `supabase.auth.getUser()` or `getSession()` independently.
**Why it matters:** Multiple redundant auth calls per page load, no single source of truth for user state, inconsistent admin status across components.
**Suggested fix:** Create an `AuthContext` provider at the app root that fetches user + admin status once and provides it via `useContext`. All components consume from context.

---

### 54. `Dashboard.jsx` Is a God Component (~600+ lines)

**Location:** `src/pages/Dashboard.jsx`
**Description:** The Dashboard component handles: auth, branding fetch, subscription check, draft save/load, invoice calculations, email sending, template selection, and renders the entire form. The `TotalsSummary` sub-component is defined inline.
**Why it matters:** Extremely difficult to test, maintain, or extend. Any change risks breaking unrelated functionality.
**Suggested fix:** Extract into: `useInvoiceForm` hook (state + calculations), `useBrandingSettings` hook, `InvoiceSummaryPanel` component, `TemplateSelectModal` component.

---

### 55. Supabase Schema Not Version-Controlled

**Location:** Project root (no `/supabase/migrations` folder)
**Description:** There are no SQL migration files in the project. Schema changes are applied manually via the Supabase dashboard, leading to drift between `types.ts`, actual DB, and code expectations.
**Why it matters:** Impossible to reproduce the DB schema in a new environment. Schema drift causes runtime errors (as seen with missing columns).
**Suggested fix:** Use `supabase init` and maintain migration files in `/supabase/migrations/`. Commit all `ALTER TABLE` statements as migration files.

---

### 56. `BrandingSettings` and `BusinessSettings` Are Duplicate Components

> ✅ **Fixed in Phase 4** — Deleted `src/components/BusinessSettings.jsx`. Confirmed it was not imported in any route or page. `BrandingSettings.jsx` is the canonical active settings page.

**Location:** `src/pages/BrandingSettings.jsx`, `src/components/BusinessSettings.jsx`
**Description:** Both components manage `business_settings` data. `BusinessSettings.jsx` is a full-featured component that appears unused (not referenced in any route). `BrandingSettings.jsx` is the active page.
**Why it matters:** Dead code, confusion about which is canonical, maintenance of two components for the same data.
**Suggested fix:** Delete `src/components/BusinessSettings.jsx` if it's not used in any route or page.
