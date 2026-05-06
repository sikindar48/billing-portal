# InvoicePort — Technical Architecture & Features

> Last updated: May 6, 2026 — Production-ready platform architecture

---

## 🏗️ Platform Architecture Overview

InvoicePort is built as a modern, scalable web application using a serverless architecture that ensures high performance, security, and reliability for invoice generation and business management.

### Technology Stack

| Layer              | Technology               | Purpose                              |
| ------------------ | ------------------------ | ------------------------------------ |
| **Frontend**       | React 18 + Vite 5        | Modern UI with fast development      |
| **Styling**        | Tailwind CSS + shadcn/ui | Consistent, responsive design system |
| **Routing**        | React Router DOM 6       | Client-side navigation and guards    |
| **Backend**        | Supabase (PostgreSQL)    | Database, authentication, real-time  |
| **Authentication** | Supabase Auth (JWT)      | Secure user management               |
| **Email**          | Gmail API v1 + EmailJS   | Dual delivery system                 |
| **PDF Generation** | jsPDF + html2canvas      | Client-side PDF creation             |
| **Deployment**     | Netlify + Supabase Cloud | Global CDN and serverless backend    |

---

## 🔐 Authentication & Security Architecture

### Smart Authentication System

**Zero-loading navigation with cached sessions**

```javascript
// AuthContext Pattern
App Mount → getSession() [instant cache lookup]
├─ No session → authLoading = false, user = null
└─ Session found → Parallel resolution:
    ├─ user_roles query → isAdmin status
    └─ user_subscriptions → plan status
    → authLoading = false (no spinner on navigation)
```

### Security Features

- ✅ **JWT Token Management**: Automatic refresh with Supabase
- ✅ **Row-Level Security (RLS)**: Database-level user isolation
- ✅ **Role-Based Access**: Admin privileges via database roles
- ✅ **Secure Secrets**: Gmail client secret in Edge Functions only
- ✅ **Rate Limiting**: OTP cooldown and API throttling

### Route Protection System

```javascript
// Guard Hierarchy
ProtectedRoute → SubscriptionGuard → AdminGuard → Page Component
     ↓                ↓                  ↓
  Auth Check    Plan Validation    Role Verification
```

**Guard Features:**

- **ProtectedRoute**: Redirects unauthenticated users
- **SubscriptionGuard**: Enforces plan limits with upgrade prompts
- **AdminGuard**: Restricts admin-only features
- **Zero DB Calls**: All guards read from AuthContext cache

---

## 📄 Invoice Generation Engine

### Template System Architecture

**9 professional templates with dynamic rendering**

```javascript
// Template Selection Flow
Dashboard → Template Gallery → Preview → PDF Generation
    ↓           ↓              ↓           ↓
Form Data → Template Props → React Render → PDF Export
```

### Real-Time Calculation Engine

```javascript
// Live calculation system
const calculations = {
  subtotal: items.reduce((sum, item) => sum + item.quantity * item.amount, 0),
  taxAmount: subtotal * (taxPercentage / 100),
  grandTotal: subtotal + taxAmount,
  roundedTotal: enableRoundOff ? Math.round(grandTotal) : grandTotal,
};
```

### Invoice Data Structure

**Optimized JSONB storage for flexibility**

```sql
-- invoices table structure
CREATE TABLE invoices (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  invoice_number text UNIQUE,
  bill_to jsonb,           -- Customer details
  ship_to jsonb,           -- Shipping address (optional)
  from_details jsonb,      -- Company branding
  items jsonb,             -- Invoice line items
  invoice_details jsonb,   -- Extended metadata
  subtotal numeric,
  grand_total numeric,
  tax numeric,
  notes text,
  template_name text,
  created_at timestamptz,
  updated_at timestamptz
);
```

### PDF Generation Pipeline

```javascript
// Multi-step PDF creation
Invoice Data → React Component → HTML String → Canvas → PDF
     ↓              ↓              ↓           ↓       ↓
  Form State → Template Render → DOM String → Image → File
```

---

## 📧 Smart Email Delivery System

### Dual Delivery Architecture

**Intelligent routing based on user plan and preferences**

```javascript
// Email routing decision tree
Send Request → Plan Check → Method Selection → Delivery → Logging
     ↓             ↓            ↓              ↓         ↓
Validation → Admin/Pro? → Gmail/EmailJS → Success → Usage Track
```

### Gmail OAuth Security

**Server-side token management for maximum security**

```
Frontend                 Edge Function           Google OAuth
   |                          |                      |
   |-- token exchange ------->|                      |
   |   { code, redirect }     |-- POST /token ------>|
   |                          |   { client_secret }  |
   |                          |<-- { tokens } -------|
   |<-- secure tokens --------|                      |
```

**Security Benefits:**

- Client secret never in browser bundle
- Automatic token refresh via Edge Functions
- Secure storage in Supabase database
- Fallback to EmailJS on failure

### Email Template System

```javascript
// Professional email composition
Invoice Data + Branding → Email Template → Personalization → Delivery
     ↓                        ↓               ↓              ↓
  PDF Attach + Company → HTML Layout → Custom Message → Send API
```

---

## 💼 Business Logic & Data Management

### Subscription Management System

**Flexible plan enforcement with automatic upgrades**

```javascript
// Plan hierarchy and limits
const planLimits = {
  trial: { invoices: 10, emails: 3, duration: "3 days" },
  pro_monthly: { invoices: "unlimited", emails: "unlimited" },
  pro_yearly: { invoices: "unlimited", emails: "unlimited" },
  enterprise: { invoices: "unlimited", emails: "unlimited", admin: true },
};
```

### Usage Tracking & Enforcement

```sql
-- Real-time usage checking
CREATE OR REPLACE FUNCTION check_email_limit(user_uuid uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Check admin status, plan limits, current usage
  -- Return: { can_send_email, current_usage, email_limit, plan_name }
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Branding Integration System

**Seamless company branding across all touchpoints**

```javascript
// Auto-fill branding pipeline
Branding Settings → Dashboard Form → Invoice Generation → Email Delivery
       ↓                ↓               ↓                  ↓
   Company Data → Form Population → PDF Branding → Email Signature
```

---

## 🔄 Advanced Workflow Features

### Invoice Status Management

**Optimistic UI updates with database synchronization**

```javascript
// Status update flow
UI Change → Optimistic Update → Database Sync → Confirmation
    ↓            ↓                  ↓             ↓
Instant UI → Local State → Background API → Toast/Revert
```

### Proforma to Tax Invoice Conversion

**Automated workflow with duplicate prevention**

```javascript
// Conversion process
Proforma Invoice → Conversion Request → New Tax Invoice → Status Update
       ↓                ↓                    ↓              ↓
   Original ID → Generate New Number → Copy Data → Mark Converted
```

### Bulk Operations Engine

```javascript
// Mass action processing
Selected Items → Validation → Batch Processing → Progress Tracking
      ↓             ↓             ↓                 ↓
   Item Array → Check Limits → Parallel Updates → UI Feedback
```

---

## 📊 Analytics & Reporting System

### Admin Dashboard Architecture

**Real-time business intelligence**

```sql
-- Revenue analytics queries
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as subscriptions,
  SUM(amount) as revenue
FROM user_subscriptions
WHERE status = 'active'
GROUP BY month
ORDER BY month DESC;
```

### Performance Monitoring

**Key metrics tracking for optimization**

```javascript
// Performance metrics
const metrics = {
  pageLoadTime:
    performance.timing.loadEventEnd - performance.timing.navigationStart,
  apiResponseTime: Date.now() - requestStart,
  userEngagement: sessionDuration,
  conversionRate: trials / visitors,
};
```

---

## 🚀 Performance Optimization Features

### Caching Strategy

**Multi-layer caching for optimal performance**

```javascript
// Caching hierarchy
Browser Cache → CDN Cache → Database Cache → Real-time Updates
      ↓           ↓           ↓               ↓
   Static Assets → API → Query Results → Live Data
```

### Optimistic UI Pattern

**Instant feedback with background synchronization**

```javascript
// Optimistic update pattern
User Action → Immediate UI → Background API → Success/Rollback
     ↓           ↓             ↓               ↓
  Click Save → Show Success → Database → Confirm/Revert
```

### Lazy Loading & Code Splitting

```javascript
// Dynamic imports for performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InvoiceHistory = lazy(() => import("./pages/InvoiceHistory"));
const AdminPanel = lazy(() => import("./pages/admin/AdminDashboard"));
```

---

## 🔧 Development & Deployment Architecture

### Environment Configuration

**Secure environment variable management**

```bash
# Production environment variables
VITE_SUPABASE_URL=          # Public Supabase endpoint
VITE_SUPABASE_PUBLISHABLE_KEY= # Public auth key
VITE_EMAILJS_SERVICE_ID=    # EmailJS service identifier
VITE_EMAILJS_PUBLIC_KEY=    # EmailJS public key (safe for browser)
VITE_GMAIL_CLIENT_ID=       # Google OAuth client ID (public)

# Server-side secrets (Edge Functions only)
GMAIL_CLIENT_SECRET=        # Never exposed to browser
```

### Deployment Pipeline

```
Code Push → Build Process → Quality Checks → Deployment → Monitoring
    ↓           ↓             ↓              ↓           ↓
  Git Push → Vite Build → Tests/Lint → Netlify → Analytics
```

### Edge Functions Architecture

**Serverless functions for secure operations**

```javascript
// Gmail token management
export const handler = async (req) => {
  const { code, redirect_uri } = await req.json();

  // Exchange code for tokens (server-side only)
  const tokens = await exchangeCodeForTokens(code, CLIENT_SECRET);

  return new Response(JSON.stringify(tokens));
};
```

---

## 📱 Mobile & Responsive Features

### Progressive Web App (PWA) Capabilities

- ✅ **Responsive Design**: Perfect experience on all screen sizes
- ✅ **Touch Optimization**: Mobile-friendly interactions
- ✅ **Offline Capability**: Core features work without internet
- ✅ **App-like Experience**: Native app feel on mobile devices

### Cross-Browser Compatibility

```javascript
// Browser support matrix
const supportedBrowsers = {
  chrome: "90+",
  firefox: "88+",
  safari: "14+",
  edge: "90+",
  mobile: "iOS 14+, Android 10+",
};
```

---

## 🔍 Monitoring & Error Handling

### Error Boundary System

```javascript
// Graceful error handling
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<LoadingSpinner />}>
    <RouteComponent />
  </Suspense>
</ErrorBoundary>
```

### Performance Monitoring

**Real-time application health tracking**

```javascript
// Key performance indicators
const healthMetrics = {
  uptime: "99.9%",
  responseTime: "<2s",
  errorRate: "<0.1%",
  userSatisfaction: "4.8/5",
};
```

### Logging & Analytics

```javascript
// Comprehensive logging system
const logEvent = (event, data) => {
  console.log(`[${new Date().toISOString()}] ${event}:`, data);
  // Send to analytics service
  analytics.track(event, data);
};
```

---

## 🎯 Scalability & Future Architecture

### Horizontal Scaling Capabilities

- ✅ **Serverless Backend**: Auto-scaling Supabase infrastructure
- ✅ **CDN Distribution**: Global content delivery via Netlify
- ✅ **Database Optimization**: Efficient queries with proper indexing
- ✅ **Caching Strategy**: Multi-layer caching for performance

### Microservices Readiness

```javascript
// Service separation potential
const services = {
  auth: "Supabase Auth",
  database: "Supabase PostgreSQL",
  email: "Gmail API + EmailJS",
  pdf: "Client-side generation",
  analytics: "Custom dashboard",
  payments: "UPI integration",
};
```

### API Design Principles

- ✅ **RESTful Endpoints**: Standard HTTP methods and status codes
- ✅ **Real-time Updates**: Supabase real-time subscriptions
- ✅ **Error Handling**: Consistent error response format
- ✅ **Rate Limiting**: Built-in Supabase rate limiting

---

## 🔒 Security & Compliance Features

### Data Protection

- ✅ **Encryption**: End-to-end data encryption
- ✅ **Access Control**: Role-based permissions
- ✅ **Audit Trails**: Complete activity logging
- ✅ **Backup Strategy**: Automated database backups

### Compliance Standards

- ✅ **GST Compliance**: Indian tax regulation adherence
- ✅ **Data Privacy**: User data protection measures
- ✅ **Security Standards**: Industry best practices
- ✅ **Accessibility**: WCAG compliance guidelines

**InvoicePort's technical architecture is designed for scalability, security, and performance, providing a solid foundation for current operations and future growth.**
