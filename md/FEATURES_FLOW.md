# InvoicePort - Features Flow Documentation

## Table of Contents

1. [User Authentication Flow](#user-authentication-flow)
2. [Invoice Creation Flow](#invoice-creation-flow)
3. [Customer Management Flow](#customer-management-flow)
4. [Invoice Status Management Flow](#invoice-status-management-flow)
5. [Payment Recording Flow](#payment-recording-flow)
6. [Email Delivery Flow](#email-delivery-flow)
7. [Gmail Integration Flow](#gmail-integration-flow)
8. [Subscription Management Flow](#subscription-management-flow)
9. [Business Settings Flow](#business-settings-flow)
10. [Email Usage Tracking Flow](#email-usage-tracking-flow)

---

## User Authentication Flow

### Registration Process

```
User visits /auth
    ↓
Enters email & password
    ↓
Supabase creates account
    ↓
OTP sent to email
    ↓
User enters OTP at /otp-verification
    ↓
Email verified
    ↓
User redirected to /dashboard
    ↓
Default trial subscription created
```

### Login Process

```
User visits /auth
    ↓
Enters credentials
    ↓
Supabase authenticates
    ↓
Session created
    ↓
User redirected to /dashboard
```

### Session Management

```
User session stored in browser
    ↓
Protected routes check auth status
    ↓
If authenticated: Allow access
    ↓
If not authenticated: Redirect to /auth
```

---

## Invoice Creation Flow

### Step 1: Template Selection

```
User navigates to /templates
    ↓
Views 10 available templates
    ↓
Clicks on preferred template
    ↓
Redirected to /dashboard with selected template
```

### Step 2: Invoice Data Entry

```
User fills invoice form:
    - Invoice number (auto-generated)
    - Invoice date
    - Due date
    - Bill To information (name, email, address)
    - Ship To information (optional)
    - Items (description, quantity, price)
    - Tax rate
    - Discount
    - Notes
    ↓
Real-time calculations:
    - Subtotal = Sum of (quantity × price)
    - Tax = Subtotal × tax_rate
    - Total = Subtotal + Tax - Discount
```

### Step 3: Invoice Preview

```
User clicks "Preview"
    ↓
Selected template renders with data
    ↓
User reviews invoice appearance
    ↓
Can edit or proceed to send/download
```

### Step 4: Invoice Actions

```
Option A: Save to Database ✅ NEW
    User clicks "Save Invoice"
        ↓
    Validate invoice data
        ↓
    Check usage limits (Trial: 10, Pro: Unlimited)
        ↓
    Save to invoices table:
        - Invoice master record
        - Customer snapshot
        - Amounts and totals
        - Status: draft
        ↓
    Save to invoice_items table:
        - Line items with details
        - Quantities and prices
        ↓
    Increment usage counter
        ↓
    Show success message
        ↓
    Invoice available in history

Option B: Download PDF
    User clicks "Download PDF"
        ↓
    jsPDF generates PDF
        ↓
    PDF downloaded to device

Option C: Send Email
    User clicks "Send Invoice"
        ↓
    Email delivery flow initiated
        ↓
    (See Email Delivery Flow)
```

### Step 5: Invoice Storage Flow ✅ NEW

```
Save Invoice clicked
    ↓
Prepare invoice data:
    1. Main invoice record:
        - user_id
        - invoice_number
        - status (draft/sent/paid)
        - issue_date, due_date
        - customer_name, customer_email, customer_address
        - subtotal, tax_amount, total_amount
        - currency, currency_symbol
        - notes, terms
        - Legacy JSONB fields (backward compatibility)
    ↓
    2. Line items:
        - invoice_id (foreign key)
        - name, description
        - quantity, unit_price
        - amount, sort_order
    ↓
Insert into database:
    - INSERT INTO invoices (...)
    - Get returned invoice.id
    - INSERT INTO invoice_items (...)
    ↓
Update usage counter:
    - Call increment_invoice_usage()
    - Update UI stats
    ↓
Success notification
```

### Step 6: Invoice Retrieval Flow ✅ NEW

```
User navigates to Invoice History
    ↓
Fetch invoices from database:
    SELECT * FROM invoices
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    ↓
Display in table:
    - Invoice number
    - Date issued
    - Client name
    - Amount
    - Actions (View/Download/Delete)
    ↓
User can:
    - Search by invoice # or client
    - View/Edit invoice
    - Download as PDF
    - Delete invoice
```

---

## Email Delivery Flow

### Email Method Selection

```
System checks user's preferred email method:
    ↓
If Gmail configured AND Pro plan:
    → Use Gmail API
    ↓
Else:
    → Use EmailJS (InvoicePort Mail)
```

### Gmail Delivery Path

```
1. Check Gmail connection status
    ↓
2. Verify Pro plan or Admin role
    ↓
3. Check email usage limits
    ↓
4. Get valid access token (refresh if needed)
    ↓
5. Create HTML email content
    ↓
6. Encode message in base64url
    ↓
7. Send via Gmail API
    ↓
8. Log email usage
    ↓
9. Update usage counter
    ↓
10. Show success message
```

### EmailJS Delivery Path (Fallback)

```
1. Check email usage limits
    ↓
2. Prepare email template data
    ↓
3. Send via EmailJS service
    ↓
4. Log email usage
    ↓
5. Update usage counter
    ↓
6. Show success message
```

### Email Delivery Decision Tree

```
Start: User clicks "Send Invoice"
    ↓
Check subscription plan
    ↓
Is Pro or Admin?
    ├─ Yes → Check Gmail connection
    │         ├─ Connected → Try Gmail API
    │         │              ├─ Success → Done ✅
    │         │              └─ Failed → Fallback to EmailJS
    │         └─ Not Connected → Use EmailJS
    │
    └─ No (Trial) → Check email limit
                    ├─ Under limit → Use EmailJS
                    └─ Over limit → Show upgrade prompt
```

---

## Gmail Integration Flow

### Initial Setup

```
User navigates to /branding
    ↓
Scrolls to Gmail Integration section
    ↓
Clicks "Connect Gmail"
    ↓
OAuth flow initiated
```

### OAuth Authentication Flow

```
1. User clicks "Connect Gmail"
    ↓
2. Redirect to Google OAuth consent screen
    URL: https://accounts.google.com/o/oauth2/v2/auth
    Parameters:
        - client_id (VITE_GMAIL_CLIENT_ID — safe to expose)
        - redirect_uri
        - response_type: code
        - scope: gmail.send, userinfo.email
        - access_type: offline
        - prompt: consent
    ↓
3. User grants permissions
    ↓
4. Google redirects to callback URL with auth code
    ↓
5. Frontend receives auth code
    ↓
6. Exchange code for tokens via Supabase Edge Function
    (client secret stays server-side — never in the bundle)
    supabase.functions.invoke('gmail-token-exchange', { code, redirect_uri })
    ↓
7. Receive access_token & refresh_token
    ↓
8. Get user's Gmail profile
    GET: https://www.googleapis.com/oauth2/v2/userinfo
    ↓
9. Save tokens to database
    Table: business_settings
    Fields:
        - gmail_access_token
        - gmail_refresh_token
        - gmail_token_expires
        - gmail_email
        - preferred_email_method: 'gmail'
    ↓
10. Show success message
    ↓
11. Redirect to /branding
```

### Token Refresh Flow

```
Before sending email:
    ↓
Check token expiration
    ↓
If expired:
    ↓
    Proxy refresh via Supabase Edge Function:
    supabase.functions.invoke('gmail-token-refresh', { refresh_token })
    (client secret stays server-side)
    ↓
    Receive new access_token
    ↓
    Update database with new token
    ↓
    Use new token for email sending
```

### Gmail Email Sending Flow

```
1. Get valid access token
    ↓
2. Create HTML email content
    ↓
3. Format as RFC 2822 message:
    - To: recipient@email.com
    - Subject: Invoice #123
    - MIME-Version: 1.0
    - Content-Type: text/html; charset=UTF-8
    - Body: HTML content
    ↓
4. Encode message:
    - UTF-8 encode: unescape(encodeURIComponent(message))
    - Base64 encode: btoa()
    - URL-safe: replace +/= with -_
    ↓
5. Send to Gmail API:
    POST: https://gmail.googleapis.com/gmail/v1/users/me/messages/send
    Headers:
        - Authorization: Bearer {access_token}
        - Content-Type: application/json
    Body:
        - raw: {encoded_message}
    ↓
6. Receive response
    ↓
7. Log success/failure
```

---

## Subscription Management Flow

### Trial Plan (Default)

```
New user registers
    ↓
Trial subscription created automatically:
    - Duration: 3 days
    - Email limit: 3 emails
    - Features: Basic invoicing, PDF export
    - Email method: EmailJS only
    ↓
Email counter tracks usage
    ↓
When limit reached:
    - Show upgrade prompt
    - Block email sending
    - Allow PDF download
```

### Pro Plan Upgrade

```
User clicks "Upgrade to Pro"
    ↓
Redirected to /subscription
    ↓
Selects plan:
    - Monthly: $X/month
    - Yearly: $Y/year (save Z%)
    ↓
Payment processing (external)
    ↓
Subscription updated in database:
    - plan_id: pro_monthly or pro_yearly
    - status: active
    - email_limit: 999999 (unlimited)
    ↓
Features unlocked:
    - Unlimited emails
    - Gmail integration
    - Priority support
    - Custom branding
```

### Plan Enforcement

```
Before any email send:
    ↓
Call: checkEmailUsageLimit(userId)
    ↓
Database RPC: check_email_limit()
    ↓
Returns:
    - can_send_email: boolean
    - current_usage: number
    - email_limit: number
    - plan_name: string
    - is_pro: boolean
    ↓
If can_send_email = false:
    - Show error message
    - Prompt to upgrade
    - Block email sending
    ↓
If can_send_email = true:
    - Proceed with email
    - Increment usage counter
```

---

## Business Settings Flow

### Company Information Setup

```
User navigates to /branding
    ↓
Fills company details:
    - Company name
    - Email
    - Phone
    - Website
    - Address
    ↓
Clicks "Save Settings"
    ↓
Data saved to business_settings table
    ↓
Used in invoice generation and emails
```

### Logo Upload

```
User clicks "Upload Logo"
    ↓
Selects image file
    ↓
File uploaded to Supabase Storage
    ↓
URL saved to business_settings
    ↓
Logo displayed on invoices
```

### Email Method Configuration

```
User selects preferred method:
    ↓
Option A: InvoicePort Mail (EmailJS)
    - Always available
    - No setup required
    - Limited to plan email quota
    ↓
Option B: Gmail (Professional)
    - Requires Pro plan
    - Requires OAuth setup
    - Unlimited emails
    - Professional sender address
    ↓
Preference saved to database
    ↓
Used for all future email sends
```

---

## Email Usage Tracking Flow

### Usage Logging

```
Email send initiated
    ↓
Before sending:
    - Check current usage
    - Verify against limit
    ↓
Send email
    ↓
After sending:
    - Log to email_usage_log table:
        * user_id
        * invoice_id
        * recipient_email
        * email_method (gmail/emailjs)
        * status (sent/failed)
        * error_message (if failed)
        * sent_at timestamp
    ↓
    - Increment usage counter:
        * user_subscriptions.email_usage_count += 1
    ↓
    - Update UI with new count
```

### Usage Display

```
Dashboard loads
    ↓
Fetch email usage stats:
    - Current usage
    - Email limit
    - Plan name
    - Remaining emails
    ↓
Display in UI:
    - "Remaining: X emails"
    - "Will send via: [Method]"
    - Progress bar (for trial users)
    ↓
Update after each send
```

### Usage Reset

```
For Trial users:
    - Reset after 3 days
    - Or on plan upgrade
    ↓
For Pro users:
    - No reset needed (unlimited)
    ↓
For Admin users:
    - Bypass all limits
```

---

## Diagnostic Tools Flow

### Gmail Connection Test

```
User clicks "Test" button
    ↓
Runs diagnostic checks:
    1. Fetch business settings
    2. Check for Gmail tokens
    3. Verify token expiration
    4. Test OAuth connection
    5. Validate email address
    ↓
Display results:
    - Connection status
    - Token validity
    - Email address
    - Expiration date
    - Recommendations
```

### Gmail Send Test

```
User clicks "Send" button
    ↓
Enters test email address
    ↓
Creates test invoice data
    ↓
Attempts Gmail send
    ↓
Measures:
    - Success/failure
    - Response time
    - Error messages
    ↓
Display detailed results:
    - Send status
    - Duration
    - Error details
    - Troubleshooting tips
```

### Plan Detection Test

```
User clicks "Plan" button
    ↓
Runs plan checks:
    1. Database RPC call
    2. Subscription query
    3. User roles check
    4. Available methods check
    ↓
Display results:
    - Plan name
    - Is Pro status
    - Email limits
    - Available features
    - Subscription details
```

---

## Error Handling Flows

### Gmail OAuth Errors

```
Error: redirect_uri_mismatch
    ↓
Solution: Update Google Cloud Console
    - Add correct redirect URI
    - Wait 5-10 minutes
    - Retry OAuth flow

Error: invalid_client
    ↓
Solution: Check credentials
    - Verify client_id
    - Verify client_secret
    - Update .env file

Error: access_denied
    ↓
Solution: User action required
    - User must grant permissions
    - Retry OAuth flow
```

### Gmail API Errors

```
Error: API not enabled
    ↓
Solution: Enable Gmail API
    - Go to Google Cloud Console
    - Enable Gmail API
    - Wait 2-5 minutes

Error: Invalid credentials
    ↓
Solution: Refresh tokens
    - Use refresh_token
    - Get new access_token
    - Retry send

Error: Rate limit exceeded
    ↓
Solution: Implement backoff
    - Wait and retry
    - Use exponential backoff
```

### Email Delivery Errors

```
Gmail send fails
    ↓
Automatic fallback to EmailJS
    ↓
Log failure reason
    ↓
Notify user of fallback
    ↓
Email still delivered
```

---

## Data Flow Architecture

### Invoice Data Flow ✅ UPDATED

```
User Input (Form)
    ↓
React State Management
    ↓
Invoice Calculations (Utils)
    ↓
Save to Database:
    - invoices table (master record)
    - invoice_items table (line items)
    ↓
Template Rendering (Components)
    ↓
PDF Generation (jsPDF) OR Email Sending
    ↓
Invoice History Display
    ↓
Retrieve from Database:
    - SELECT with user_id filter
    - RLS enforces data isolation
```

### Database Schema Flow ✅ NEW

```
User creates invoice
    ↓
Data saved to tables:

1. invoices table:
    - id (UUID, primary key)
    - user_id (foreign key to auth.users)
    - customer_id (foreign key to customers, optional)
    - invoice_number (unique per user)
    - status (draft/sent/paid/overdue/cancelled)
    - issue_date, due_date
    - customer_name, customer_email, customer_address (snapshot)
    - subtotal, tax_amount, total_amount
    - currency, currency_symbol
    - notes, terms
    - Legacy JSONB fields (bill_to, ship_to, invoice_details, from_details, items)
    - created_at, updated_at

2. invoice_items table:
    - id (UUID, primary key)
    - invoice_id (foreign key to invoices)
    - product_id (foreign key to products, optional)
    - name, description
    - quantity, unit_price
    - tax_rate, discount_amount
    - amount (calculated total)
    - sort_order
    - created_at
    ↓
Row Level Security (RLS):
    - Users only see their own data
    - Enforced at database level
    ↓
Indexes for performance:
    - user_id, invoice_number
    - customer_id, status
    - issue_date, due_date
```

### Email Data Flow

```
Invoice Data
    ↓
Email Content Creation (Utils)
    ↓
HTML Template Rendering
    ↓
Email Method Selection
    ↓
Gmail API OR EmailJS
    ↓
Email Usage Logging
    ↓
Usage Counter Update
    ↓
UI Refresh
```

### Authentication Data Flow

```
User Credentials
    ↓
Supabase Auth API
    ↓
JWT Token Generation
    ↓
Browser Storage (Session)
    ↓
AuthContext (onAuthStateChange)
    ↓
Parallel DB calls (Promise.allSettled):
    - user_roles table → isAdmin (DB-only, no client-side email list)
    - user_subscriptions table → subscriptionStatus
    ↓
Context provides: user, isAdmin, subscriptionStatus, authLoading
    ↓
All pages consume via useAuth() — zero redundant getUser() calls
    ↓
Protected Route / AdminGuard / SubscriptionGuard read from context
```

---

## Integration Points

### Supabase Integration

- **Authentication**: User login/signup
- **Database**: PostgreSQL for data storage
- **Storage**: File uploads (logos)
- **RPC Functions**: Complex queries and operations
- **Real-time**: Live data updates (optional)

### Gmail API Integration

- **OAuth 2.0**: User authentication
- **Gmail API v1**: Email sending
- **Token Management**: Refresh and storage
- **Error Handling**: Graceful degradation

### EmailJS Integration

- **Service**: Email delivery service
- **Templates**: Pre-configured email templates
- **API**: Simple REST API
- **Fallback**: Backup email method

---

## Performance Optimization

### Email Sending

- Token caching to reduce API calls
- Async operations for non-blocking UI
- Error retry with exponential backoff
- Fallback mechanism for reliability

### Database Queries

- Indexed columns for fast lookups
- RPC functions for complex operations
- Connection pooling
- Query optimization

### Frontend Performance

- Code splitting for faster loads
- Lazy loading of routes
- Image optimization
- Bundle size optimization

---

## Security Measures

### Data Protection

- Row Level Security (RLS) on all tables
- Encrypted token storage
- HTTPS-only communication
- Environment variable protection

### Authentication Security

- JWT token validation
- Session expiration
- Password hashing (Supabase)
- Email verification

### API Security

- OAuth 2.0 for Gmail
- API key protection
- Rate limiting
- CORS configuration

---

## Monitoring & Logging

### Email Tracking

- All emails logged to database
- Success/failure status
- Error messages captured
- Timestamp recording

### Usage Analytics

- Email usage per user
- Plan distribution
- Feature usage stats
- Error rate monitoring

### System Health

- API response times
- Database performance
- Email delivery rates
- User activity metrics

---

## Future Enhancement Flows

### Planned Features

1. **Recurring Invoices**: Automatic invoice generation
2. **Payment Integration**: Stripe/PayPal integration
3. **Multi-language**: Internationalization support
4. **Advanced Analytics**: Detailed reporting
5. **Mobile App**: React Native application
6. **API Access**: RESTful API for integrations
7. **Webhooks**: Event notifications
8. **Team Collaboration**: Multi-user accounts

---

## Last Updated

March 23, 2026

**Latest Update**: Phase 4 complete — Gmail token exchange proxied via Supabase Edge Functions (client secret removed from bundle), admin check migrated to DB-only, AuthContext is now the single source of truth for all auth state across the entire app.

---

## Customer Management Flow

### Customer Creation

```
User navigates to /customers
    ↓
Clicks "Add Customer" button
    ↓
Modal dialog opens
    ↓
User fills customer details:
    - Name (required)
    - Email
    - Phone
    - Address (street, city, state, ZIP, country)
    - Tax ID
    - Notes
    ↓
Clicks "Create Customer"
    ↓
Validation:
    - Name is required
    - Email format (if provided)
    ↓
Save to database:
    INSERT INTO customers (
        user_id, name, email, phone,
        address, city, state, zip_code,
        country, tax_id, notes, is_active
    ) VALUES (...)
    ↓
Success notification
    ↓
Customer appears in grid
```

### Customer Search & Filter

```
User types in search bar
    ↓
Real-time filtering:
    - Search by name (case-insensitive)
    - Search by email
    - Search by phone
    ↓
Results update immediately
    ↓
Display matching customers in grid
```

### Customer Edit

```
User clicks "Edit" on customer card
    ↓
Modal opens with pre-filled data
    ↓
User modifies fields
    ↓
Clicks "Update Customer"
    ↓
Validation
    ↓
Update database:
    UPDATE customers
    SET name = ?, email = ?, ...
    WHERE id = ? AND user_id = auth.uid()
    ↓
Success notification
    ↓
Customer card updates
```

### Customer Delete (Soft Delete)

```
User clicks trash icon
    ↓
Confirmation dialog
    ↓
User confirms
    ↓
Soft delete:
    UPDATE customers
    SET is_active = false
    WHERE id = ? AND user_id = auth.uid()
    ↓
Customer removed from view
    ↓
Data preserved in database
```

---

## Invoice Status Management Flow

### Status Workflow

```
Invoice created → Status: Draft
    ↓
User changes status to "Sent"
    ↓
    UPDATE invoices
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = ? AND user_id = auth.uid()
    ↓
Status badge updates to blue "Sent"
    ↓
User records payment
    ↓
Status automatically changes to "Paid"
    ↓
    UPDATE invoices
    SET status = 'paid',
        paid_at = NOW()
    WHERE id = ? AND user_id = auth.uid()
    ↓
Status badge updates to green "Paid"
```

### Status Change Flow

```
User in Invoice History
    ↓
Clicks status badge dropdown
    ↓
Selects new status:
    - Draft (gray)
    - Sent (blue)
    - Paid (green)
    - Overdue (red)
    - Cancelled (gray)
    ↓
Status updates in database
    ↓
Timestamps updated:
    - sent_at (when marked as sent)
    - paid_at (when marked as paid)
    ↓
Visual badge updates
    ↓
Toast notification
```

### Status Filter Flow

```
User clicks status filter dropdown
    ↓
Selects status:
    - All Status
    - Draft
    - Sent
    - Paid
    - Overdue
    - Cancelled
    ↓
Invoice list filters:
    WHERE status = ? OR 'all'
    ↓
Display filtered invoices
    ↓
Update count display
```

---

## Payment Recording Flow

### Record Payment

```
User in Invoice History
    ↓
Finds unpaid invoice
    ↓
Clicks 💵 (dollar sign) button
    ↓
Payment modal opens
    ↓
Modal displays:
    - Invoice number
    - Total amount
    ↓
User fills payment details:
    - Amount (pre-filled with invoice total)
    - Payment method (cash/check/card/bank_transfer/other)
    - Payment date (defaults to today)
    - Transaction ID (optional)
    - Reference number (optional)
    - Notes (optional)
    ↓
Clicks "Record Payment"
    ↓
Validation:
    - Amount > 0
    - Payment date provided
    ↓
Save to database:
    INSERT INTO payments (
        invoice_id, user_id, amount,
        payment_method, payment_date,
        transaction_id, reference_number,
        notes, status
    ) VALUES (...)
    ↓
Check if full payment:
    IF payment_amount >= invoice_total
        ↓
        Update invoice status to "paid"
        UPDATE invoices
        SET status = 'paid',
            paid_at = NOW()
        WHERE id = ?
    ↓
Success notification
    ↓
Modal closes
    ↓
Invoice list refreshes
    ↓
Status badge updates to "Paid"
```

### Payment Data Structure

```
Payment Record:
{
    invoice_id: UUID,
    user_id: UUID,
    amount: DECIMAL,
    payment_method: TEXT,
    payment_date: DATE,
    transaction_id: TEXT (optional),
    reference_number: TEXT (optional),
    notes: TEXT (optional),
    status: 'completed',
    created_at: TIMESTAMP
}
```

---

## Subscription Analytics Flow ✨ NEW

### Analytics Dashboard Access

```
User navigates to /analytics
    ↓
Protected route check:
    - User authenticated?
    - Subscription active?
    ↓
Load analytics data
```

### Data Fetching Flow

```
Component mounts
    ↓
Fetch subscription data:
    SELECT * FROM user_subscriptions
    JOIN subscription_plans
    WHERE status IN ('active', 'trialing')
    ↓
Calculate metrics:
    1. MRR (Monthly Recurring Revenue):
        - For yearly plans: price / 12
        - For monthly plans: price
        - Sum all active subscriptions

    2. Active Plans Count:
        - Trial: status = 'trialing'
        - Pro: slug = 'monthly' AND status = 'active'
        - Enterprise: slug = 'yearly' AND status = 'active'

    3. Trial Users:
        - Count where status = 'trialing'

    4. Conversion Rate:
        - (Paid users / Total users) × 100

    5. Email Usage:
        - Fetch from email_usage_tracking
        - Calculate percentage used

    6. Plan Distribution:
        - Group by plan type
        - Calculate percentages
    ↓
Display in UI:
    - Metric cards with icons
    - Progress bars
    - Color-coded indicators
    - Visual charts
```

### Real-time Updates

```
User performs action (sends email, upgrades plan)
    ↓
Database updated
    ↓
Analytics page refreshes data
    ↓
Metrics update automatically
```

---

## Audit Logs Flow ✨ NEW

### Log Creation Flow

```
User performs action:
    - Creates invoice
    - Updates payment
    - Changes status
    - Deletes customer
    ↓
System captures:
    - user_id (who)
    - user_identity_type (user/admin/system)
    - action_type (what action)
    - resource_type (what entity)
    - resource_id (which record)
    - details (description)
    - old_values (before state)
    - new_values (after state)
    - ip_address (from where)
    - user_agent (which browser)
    - created_at (when)
    ↓
Insert into audit_logs table:
    INSERT INTO audit_logs (...)
    VALUES (...)
    ↓
Log stored permanently
```

### Audit Logs Viewer Flow

```
Admin navigates to /audit-logs
    ↓
Admin check:
    - Is user admin?
    - Check user_roles table
    - Check email whitelist
    ↓
If not admin → Redirect
    ↓
If admin → Load logs:
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 500
    ↓
Display in table:
    - Timestamp
    - Identity badge (user/admin/system)
    - Action badge (created/updated/deleted)
    - Resource type
    - Details
    - IP address
```

### Filtering Flow

```
User selects filters:
    ↓
Identity Type Filter:
    - All
    - User
    - Admin
    - System
    ↓
Action Type Filter:
    - All
    - invoice_created
    - invoice_updated
    - payment_recorded
    - status_changed
    - etc.
    ↓
Date Range Filter:
    - All Time
    - Today
    - Last 7 Days
    - Last 30 Days
    ↓
Apply filters client-side:
    filtered = logs.filter(log => {
        matchesIdentity &&
        matchesAction &&
        matchesDate
    })
    ↓
Update display
    ↓
Show filtered count
```

### Pagination Flow

```
500 logs loaded
    ↓
Display 20 per page
    ↓
User clicks "Next"
    ↓
Show logs 21-40
    ↓
Update page indicator
    ↓
Enable/disable navigation buttons
```

---

## Public Invoice Verification Flow ✨ NEW

### Verification Access

```
Anyone visits /verify-invoice
    ↓
No authentication required
    ↓
Public page loads
```

### Verification Process

```
User enters invoice number
    ↓
Clicks "Verify" button
    ↓
Query database:
    SELECT * FROM invoices
    WHERE invoice_number = ?
    LIMIT 1
    ↓
Public RLS policy allows read
    ↓
If found:
    ↓
    Display verification success:
        ✅ Invoice Verified
        - Company information
        - Customer information
        - Amount and currency
        - Status badge
        - Issue and due dates
        - Notes
    ↓
If not found:
    ↓
    Display not found message:
        ❌ Invoice Not Found
        - Helpful error message
        - Suggestions to check number
```

### Security Flow

```
Public access enabled
    ↓
RLS policy:
    CREATE POLICY "Public invoice verification"
    ON invoices FOR SELECT
    USING (true)
    ↓
Read-only access:
    - No INSERT
    - No UPDATE
    - No DELETE
    ↓
Sensitive data hidden:
    - No user_id exposed
    - No internal IDs shown
    - Only public info displayed
```

---

## Database Migration Flow ✨ NEW

### Migration Execution

```
Developer runs migration:
    ↓
Option 1: Supabase Dashboard
    - Open SQL Editor
    - Paste migration SQL
    - Click "Run"
    ↓
Option 2: Supabase CLI
    - Run: supabase db push
    ↓
Option 3: Direct psql
    - Connect to database
    - Run migration file
    ↓
Migration executes:
    - Add missing columns
    - Create missing tables
    - Add indexes
    - Set up RLS policies
    ↓
Verify success:
    - Check columns exist
    - Check tables exist
    - Check policies active
```

### Column Addition Flow

```
Migration checks:
    IF NOT EXISTS (column 'sent_at')
    ↓
    ALTER TABLE invoices
    ADD COLUMN sent_at TIMESTAMPTZ
    ↓
    Success: Column added
    ↓
    ELSE: Skip (already exists)
```

### Table Creation Flow

```
Migration checks:
    IF NOT EXISTS (table 'audit_logs')
    ↓
    CREATE TABLE audit_logs (...)
    ↓
    Add indexes
    ↓
    Enable RLS
    ↓
    Create policies
    ↓
    Success: Table ready
    ↓
    ELSE: Check and fix columns
```

### Column Rename Flow

```
Migration detects old column names:
    - 'action' instead of 'action_type'
    - 'entity_type' instead of 'resource_type'
    - 'entity_id' instead of 'resource_id'
    ↓
Rename columns:
    ALTER TABLE audit_logs
    RENAME COLUMN action TO action_type
    ↓
    ALTER TABLE audit_logs
    RENAME COLUMN entity_type TO resource_type
    ↓
    ALTER TABLE audit_logs
    RENAME COLUMN entity_id TO resource_id
    ↓
Update indexes:
    DROP old indexes
    CREATE new indexes
    ↓
Success: Schema updated
```

---

## Error Handling & Troubleshooting Flows ✨ NEW

### Missing Column Error Flow

```
Error: "column 'sent_at' does not exist"
    ↓
Application detects error
    ↓
Graceful fallback:
    - Try update without timestamp
    - Show user-friendly message
    - Suggest running migration
    ↓
User sees:
    "Status updated. Run migration for timestamps."
    ↓
User runs migration
    ↓
Feature works fully
```

### Missing Table Error Flow

```
Error: "relation 'audit_logs' does not exist"
    ↓
Application detects error
    ↓
Show helpful message:
    "Audit logs table not found.
     Please run database migration."
    ↓
Prevent app crash
    ↓
Display empty state
    ↓
User runs migration
    ↓
Table created
    ↓
Feature works
```

### Column Name Mismatch Flow

```
Error: "column 'action_type' does not exist"
    ↓
Indicates old schema
    ↓
User runs fix migration:
    - Renames old columns
    - Adds missing columns
    - Updates indexes
    ↓
Schema aligned
    ↓
Application works
```

### Migration Verification Flow

```
After running migration:
    ↓
Run verification queries:
    1. Check invoices columns:
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'invoices'
        AND column_name IN ('sent_at', 'paid_at')
    ↓
    2. Check audit_logs table:
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'audit_logs'
    ↓
    3. Check audit_logs columns:
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'audit_logs'
        AND column_name IN (
            'action_type',
            'resource_type',
            'resource_id',
            'user_identity_type'
        )
    ↓
All checks pass:
    ✅ Migration successful
    ↓
Refresh application
    ↓
Features work correctly
```

---

## Last Updated

February 20, 2026

**Latest Update**: Added Subscription Analytics flow, Audit Logs flow, Public Invoice Verification flow, and Database Migration troubleshooting flows. Complete workflows for analytics dashboard, audit logging, public verification, and database schema fixes.
