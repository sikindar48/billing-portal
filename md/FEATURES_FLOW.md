# InvoicePort — Features Flow Documentation

> Last updated: March 28, 2026

## Table of Contents

1. [User Authentication Flow](#user-authentication-flow)
2. [Invoice Creation Flow](#invoice-creation-flow)
3. [Invoice History Flow](#invoice-history-flow)
4. [Email Delivery Flow](#email-delivery-flow)
5. [Gmail Integration Flow](#gmail-integration-flow)
6. [Subscription Management Flow](#subscription-management-flow)
7. [Branding Settings Flow](#branding-settings-flow)
8. [Customer Management Flow](#customer-management-flow)
9. [Authentication Data Flow](#authentication-data-flow)

---

## User Authentication Flow

### Registration

```
User visits /
    ↓
Enters name, email, password
    ↓
supabase.auth.signUp()
    ↓
Confirmation email sent
    ↓
User confirms email → redirected to /
    ↓
AuthContext detects SIGNED_IN event
    ↓
Trial subscription created (3 days, 10 invoice limit)
    ↓
Redirected to /dashboard
```

### Login

```
User visits /
    ↓
Enters email + password
    ↓
supabase.auth.signInWithPassword()
    ↓
AuthContext fires SIGNED_IN
    ↓
Parallel DB calls:
    user_roles → isAdmin
    user_subscriptions → subscriptionStatus
    ↓
Redirected to /dashboard
```

### Password Reset (OTP)

```
User clicks "Forgot password?"
    ↓
60-second cooldown enforced (client-side)
    ↓
sendOTP(email, 'password_reset')
    ↓
User navigates to /otp-verification
    ↓
Enters OTP → password reset
```

### Session on Navigation

```
User navigates between tabs
    ↓
AuthContext.getSession() [from local cache — instant]
    ↓
authLoading = false immediately
    ↓
No spinner shown — page renders directly
    ↓
onAuthStateChange handles TOKEN_REFRESHED silently
```

---

## Invoice Creation Flow

### Data Entry

```
User opens /dashboard
    ↓
Branding loaded from branding_settings:
    - company_name, logo_url, website
    - phone, address, tagline, currency (from metadata JSONB)
    ↓
Applied to "Your Company" fields once via useRef flag
    ↓
User fills:
    - Bill To (name, email, address, phone) — required
    - Ship To (optional)
    - Invoice Number (auto-generated: INV-YY-RANDOM6)
    - Issue Date (DD/MM/YYYY)
    - Due Date (DD/MM/YYYY, optional)
    - Items (name, description, quantity, unit price)
    - Tax % + Tax Type (IGST / CGST+SGST / Standard)
    - Round Off toggle
    - Invoice Type (Proforma / Tax Invoice)
    - Notes
```

### Calculations (real-time)

```
subtotal = Σ (quantity × unit_price)
taxAmount = subtotal × (taxPercentage / 100)
grandTotal = subtotal + taxAmount
if enableRoundOff: grandTotal = Math.round(grandTotal)
```

### Save Invoice

```
User clicks "Save Invoice"
    ↓
Validate: billTo.name, billTo.email, items, grandTotal > 0
    ↓
Check usage limit (Trial: 10, Pro: unlimited, Admin: bypass)
    ↓
INSERT INTO invoices:
    user_id, invoice_number,
    subtotal, grand_total, tax,
    notes, template_name,
    bill_to (JSONB), ship_to (JSONB),
    from_details (JSONB),
    items (JSONB),
    invoice_details (JSONB):
        { number, date, paymentDate, invoiceMode,
          status: 'draft', taxType, taxAmount,
          enableRoundOff, roundOffAmount,
          currency, currency_symbol }
    ↓
supabase.rpc('increment_invoice_usage')
    ↓
Toast: "Invoice saved successfully!"
```

### Template Preview & PDF

```
User clicks template icon
    ↓
Selects template (1–9), default: Template 3
    ↓
selectedTemplateId saved in state
    ↓
Navigate to /template with formData
    ↓
User previews rendered invoice
    ↓
Clicks Download → generatePDF(formData, templateNumber)
    ↓
ReactDOMServer.renderToString → html2canvas → jsPDF → save
```

---

## Invoice History Flow

### Loading

```
User navigates to /invoice-history
    ↓
SELECT * FROM invoices
WHERE user_id = auth.uid()
ORDER BY created_at DESC
    ↓
Display table with:
    - Invoice # | Date (from invoice_details.date) | Client | Status | Amount | Actions
```

### Status Change

```
User changes status dropdown
    ↓
Optimistic UI update (instant)
    ↓
Fetch current invoice_details from DB
    ↓
Merge: { ...invoice_details, status: newStatus }
    ↓
UPDATE invoices SET invoice_details = merged
    ↓
Toast confirmation
    (on failure: revert + reload)
```

### Download from History

```
User clicks Download
    ↓
Compute: taxAmt = subtotal × tax / 100
    ↓
Parse template: parseInt(template_name.replace('template_','')) || 3
    ↓
generatePDF({
    billTo, shipTo,
    invoice: { ...invoice_details, number: invoice_number },
    yourCompany: from_details,
    items, taxPercentage, taxAmount, subTotal, grandTotal,
    notes, selectedCurrency
}, templateNumber)
```

### Convert Proforma → Tax Invoice

```
User clicks convert button (proforma only, not already converted)
    ↓
Confirm dialog
    ↓
Generate new invoice number
    ↓
INSERT new invoice with:
    invoiceMode: 'tax_invoice', status: 'paid'
    converted_from_id: original.id (in invoice_details)
    ↓
UPDATE original invoice_details: { status: 'converted' }
    ↓
Toast: "Tax Invoice INV-XX-XXXXX created!"
```

### Record Payment

```
User clicks $ button on unpaid invoice
    ↓
Payment modal: amount, method, date, notes
    ↓
If amount >= grand_total:
    → handleStatusChange(id, 'paid')
    ↓
Toast: "Payment recorded successfully"
```

---

## Email Delivery Flow

### Decision Tree

```
User clicks "Send Mail"
    ↓
validateInvoiceForEmail() — checks billTo.email, items, total
    ↓
validateEmailSendRequest()
    ├─ Admin → unlimited, any method
    ├─ Pro → check Gmail connection
    │         ├─ Connected → Gmail API
    │         └─ Not connected → EmailJS
    └─ Trial → check email limit
               ├─ Under limit → EmailJS
               └─ Over limit → show upgrade prompt
    ↓
Send → logEmailUsage() → update UI stats
```

### Gmail Path

```
getValidAccessToken()
    ↓
If expired → supabase.functions.invoke('gmail-token-refresh')
    ↓
Create RFC 2822 message → base64url encode
    ↓
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
    ↓
On failure → fallback to EmailJS
```

### EmailJS Path

```
emailjs.send(serviceId, templateId, params)
    ↓
On success → logEmailUsage()
    ↓
Update remaining email count in UI
```

---

## Gmail Integration Flow

### OAuth Setup

```
User goes to /branding → Email Configuration → Gmail
    ↓
Clicks "Connect Gmail"
    ↓
Redirect to Google OAuth consent screen:
    client_id, redirect_uri, scope: gmail.send + userinfo
    ↓
User grants permissions
    ↓
Google redirects to /gmail-callback?code=...
    ↓
supabase.functions.invoke('gmail-token-exchange', { code, redirect_uri })
    (client secret stays server-side — never in bundle)
    ↓
Receive access_token + refresh_token
    ↓
GET https://www.googleapis.com/oauth2/v2/userinfo → get email
    ↓
UPSERT branding_settings:
    gmail_access_token, gmail_refresh_token,
    gmail_token_expires, gmail_email
    ↓
Redirect to /branding — "Gmail connected!"
```

### Token Refresh

```
Token expired?
    ↓
supabase.functions.invoke('gmail-token-refresh', { refresh_token })
    ↓
New access_token → update branding_settings
    ↓
Continue with email send
```

---

## Subscription Management Flow

### Trial (default)

```
New confirmed user, no subscription found
    ↓
UPSERT user_subscriptions:
    plan_id: 1, status: 'trialing'
    current_period_end: now + 3 days
    ↓
Invoice limit: 10
Email limit: 3 (via check_email_limit RPC)
```

### Plan Enforcement

```
checkEmailUsageLimit()
    ↓
isAdminUser() → user_roles DB query
    ↓
If admin → unlimited
    ↓
Else → supabase.rpc('check_email_limit')
    → { can_send_email, current_usage, email_limit, plan_name, is_pro }
```

### Pro Upgrade

```
User selects Pro plan on /subscription
    ↓
UPI QR code generated (qrcode.js)
    ↓
User pays → enters transaction ID
    ↓
INSERT subscription_requests:
    { user_id, plan_id (resolved by slug), message, status: 'pending' }
    ↓
Admin verifies → manually activates plan
    ↓
user_subscriptions updated: status: 'active'
```

---

## Branding Settings Flow

### Load

```
User navigates to /branding
    ↓
SELECT * FROM branding_settings WHERE user_id = ?
    ↓
Map columns:
    company_name → settings.company_name
    logo_url     → settings.logo_url
    website      → settings.company_website
    metadata     → { tagline, email, phone, address,
                     invoice_prefix, currency, tax_rate,
                     preferred_email_method }
```

### Save

```
User fills form → clicks Save
    ↓
UPSERT branding_settings:
    company_name, logo_url, website,
    metadata: {
        tagline, email, phone, address,
        invoice_prefix, currency, tax_rate,
        preferred_email_method
    }
    ↓
Toast: "Settings saved"
```

### Dashboard Auto-fill

```
Dashboard mounts → fetch branding_settings
    ↓
brandingAppliedRef.current = false
    ↓
useEffect fires once:
    setYourCompany({
        name: branding.company_name,
        website: branding.website,
        address: branding.metadata.address,
        phone: branding.metadata.phone
    })
    ↓
brandingAppliedRef.current = true (never runs again)
```

---

## Customer Management Flow

### CRUD

```
/customers page
    ↓
Load: SELECT * FROM customers WHERE user_id = ? AND is_active = true
    ↓
Add: INSERT INTO customers { user_id, name, email, phone, address, ... }
    ↓
Edit: UPDATE customers SET ... WHERE id = ?
    ↓
Delete (soft): UPDATE customers SET is_active = false WHERE id = ?
```

> Note: `customers` table may not exist in the current DB. If queries fail, the page shows an empty state gracefully.

---

## Authentication Data Flow

```
App mounts → AuthProvider
    ↓
supabase.auth.getSession() [instant, from cache]
    ├─ No session → authLoading = false, user = null
    └─ Session found →
         Promise.allSettled([
             user_roles query  → isAdmin
             user_subscriptions → subscriptionStatus
         ])
         → authLoading = false, resolvedRef = true
    ↓
onAuthStateChange (background)
    ├─ SIGNED_OUT       → clear all state
    ├─ TOKEN_REFRESHED  → update user only
    ├─ INITIAL_SESSION  → skip (already resolved)
    └─ SIGNED_IN        → resolve fresh (new login)
    ↓
Context: { user, isAdmin, subscriptionStatus, authLoading }
    ↓
Guards read from context — zero DB calls on navigation
    ↓
LandingPage: if (!authLoading && user) → navigate('/dashboard')
```
