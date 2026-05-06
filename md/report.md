# Development Phases for Invoice Management System

## Phase 1: Critical Revenue & Trust Issues (Week 1-2)

_Must fix before any marketing or user acquisition_

### 1.1 Payment System Overhaul

- **Manual payment verification** — Implement automated payment confirmation via Razorpay/Cashfree
- Set 24h SLA for manual verifications with auto-confirmation emails
- Add payment status tracking and user notifications

### 1.2 Email Delivery Reliability

- **Email fallback failure** — Define behavior when both Gmail API and EmailJS fail
- Don't deduct quota on failed sends
- Add delivery status persistence and retry mechanism

### 1.3 Server-Side Enforcement

- **Trial limit race condition** — Enforce limits server-side before UI updates
- Add real-time usage counter on dashboard
- Implement rollback for optimistic updates on limit exceeded

## Phase 2: Security & Compliance (Week 3-4)

_Essential before public launch_

### 2.1 OAuth Security

- **Gmail OAuth disconnect** — Add "Disconnect Gmail" button in settings
- Handle token refresh failures and revocation webhooks
- Document fallback to EmailJS on OAuth issues

### 2.2 Data Integrity & Audit

- **Proforma conversion reversibility** — Add grace-period undo functionality
- Implement audit trail for all conversions
- Keep original proforma accessible after conversion

### 2.3 Rate Limiting & Security

- **OTP rate limiting** — Confirm server-side enforcement in Supabase
- Add CAPTCHA on 3+ failed attempts
- Prevent email enumeration attacks

## Phase 3: User Experience & Onboarding (Week 5-6)

_Improve conversion and reduce support burden_

### 3.1 Guided Onboarding

- **Branding setup flow** — Force or prominently prompt branding setup
- Add setup wizard for first-time users
- Auto-detect missing branding and warn on invoice creation

### 3.2 Customer Data Management

- **Soft-delete handling** — Snapshot customer data into invoice records
- Ensure old PDFs render correctly after customer deletion
- Implement data denormalization for invoice history

### 3.3 Bulk Operations

- **Bulk email quota validation** — Pre-validate total quota before bulk sends
- Show send limits and upgrade CTAs
- Handle partial success scenarios gracefully

## Phase 4: Advanced Features & Scaling (Week 7-8)

_Prepare for growth and enterprise customers_

### 4.1 Public Invoice Features

- **Invoice verification system** — Add link expiry and version tracking
- Handle deleted invoices gracefully
- Implement tampering detection warnings

### 4.2 Enterprise Support

- **Enterprise onboarding flow** — Add contact/inquiry system
- Document manual provisioning process
- Define dedicated support operations

### 4.3 Session Management

- **Session policies** — Define TTL and concurrent session limits
- Add logout-everywhere functionality
- Handle token refresh failures properly

## Phase 5: Compliance & Data Management (Week 9-10)

_Legal requirements and user rights_

### 5.1 Data Export & Deletion

- **Account data export** — Full data download functionality
- Account deletion with proper data handling
- Anonymization vs hard-delete policies

### 5.2 Audit & Compliance

- **GST audit log retention** — 6-year retention policy implementation
- Immutable audit logs with access controls
- Admin-only audit log access

### 5.3 Offline Capabilities

- **Define offline scope** — Specify exactly which features work offline
- Implement local storage and sync if needed
- Remove claims if not implementing offline features

---

## Implementation Priority Matrix

| Phase   | Business Impact | Technical Complexity | Risk Level |
| ------- | --------------- | -------------------- | ---------- |
| Phase 1 | 🔴 Critical     | 🟡 Medium            | 🔴 High    |
| Phase 2 | 🔴 Critical     | 🟡 Medium            | 🔴 High    |
| Phase 3 | 🟡 High         | 🟢 Low               | 🟡 Medium  |
| Phase 4 | 🟡 Medium       | 🟡 Medium            | 🟡 Medium  |
| Phase 5 | 🟡 Medium       | 🟡 Medium            | 🟢 Low     |
