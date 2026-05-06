# InvoicePort — Features & User Flow Guide

> Last updated: May 6, 2026

## 🚀 Platform Overview

InvoicePort is a comprehensive GST-compliant invoice generation platform designed for Indian businesses, freelancers, and startups. The platform combines professional invoice templates, automated email delivery, subscription management, and business branding in a seamless user experience.

## 📋 Table of Contents

1. [🔐 User Authentication & Onboarding](#user-authentication--onboarding)
2. [📄 Invoice Creation & Management](#invoice-creation--management)
3. [📧 Smart Email Delivery System](#smart-email-delivery-system)
4. [💼 Business Branding & Customization](#business-branding--customization)
5. [💳 Subscription & Payment Flow](#subscription--payment-flow)
6. [👥 Customer & Inventory Management](#customer--inventory-management)
7. [📊 Analytics & Admin Features](#analytics--admin-features)
8. [🔄 Advanced Workflows](#advanced-workflows)

---

## 🔐 User Authentication & Onboarding

### ✨ Key Features

- **Instant Trial Access**: 3-day trial with 10 invoices and 3 emails
- **Secure Email Verification**: Supabase-powered authentication
- **Smart Password Recovery**: OTP-based reset with rate limiting
- **Zero-Flash Navigation**: Cached session for instant page loads

### 🎯 User Journey

#### New User Registration

```
Landing Page → Sign Up Form → Email Verification → Trial Activation → Dashboard
```

**Step-by-Step Flow:**

1. **Discovery**: User visits landing page, sees features and pricing
2. **Registration**: Enters name, email, password
3. **Verification**: Receives confirmation email, clicks link
4. **Auto-Setup**: Trial subscription (3 days, 10 invoices) created automatically
5. **Welcome**: Redirected to dashboard with onboarding hints

#### Returning User Login

```
Login Form → Instant Authentication → Dashboard (No Loading)
```

**Smart Session Management:**

- Session cached locally for instant access
- Admin status and subscription loaded in parallel
- Zero loading spinners on tab navigation
- Automatic token refresh in background

#### Password Recovery

```
Forgot Password → OTP Request → Email Verification → New Password → Login
```

**Security Features:**

- 60-second cooldown between OTP requests
- Secure token-based verification
- Rate limiting to prevent abuse

---

## 📄 Invoice Creation & Management

### ✨ Key Features

- **9 Professional Templates**: Modern, GST-compliant designs
- **Real-Time Calculations**: Auto-compute taxes, totals, round-offs
- **Smart Invoice Numbers**: Secure non-sequential format (INV-YY-RANDOM6)
- **Dual Invoice Types**: Proforma and Tax Invoice support
- **PDF Export**: High-quality downloads with template preservation

### 🎯 Invoice Creation Flow

#### Template Selection & Customization

```
Dashboard → Template Gallery → Preview → Customize → Generate
```

**Template Features:**

- **Template 3** (Default): Clean, professional layout
- **9 Unique Designs**: From minimal to detailed layouts
- **GST Compliance**: All templates include required tax fields
- **Brand Integration**: Auto-fills company details from branding settings

#### Data Entry & Validation

```
Company Details → Bill To → Items → Tax Configuration → Review → Save
```

**Smart Form Features:**

1. **Auto-Fill Company Info**: Pulls from branding settings
2. **Customer Quick-Add**: Save frequently used customer details
3. **Item Management**: Description, quantity, unit price with real-time totals
4. **Tax Options**: IGST, CGST+SGST, or Standard tax types
5. **Currency Support**: Multiple currencies with symbol display

#### Real-Time Calculations

```javascript
// Live calculation engine
subtotal = Σ (quantity × unit_price)
taxAmount = subtotal × (taxPercentage / 100)
grandTotal = subtotal + taxAmount
if (enableRoundOff) grandTotal = Math.round(grandTotal)
```

### 🎯 Invoice Management Flow

#### History & Status Tracking

```
Invoice List → Filter/Search → Status Updates → Actions
```

**Management Features:**

- **Smart Filtering**: By status, type, date range, customer
- **Bulk Actions**: Status updates, exports, deletions
- **Payment Tracking**: Record payments, mark as paid
- **Conversion Tools**: Proforma → Tax Invoice with one click

#### Advanced Actions

1. **View & Edit**: Load invoice back into editor
2. **Download PDF**: Generate with original template
3. **Send Email**: Direct delivery to customers
4. **Duplicate**: Create similar invoices quickly
5. **Convert**: Proforma to Tax Invoice (prevents duplicates)

---

## 📧 Smart Email Delivery System

### ✨ Key Features

- **Dual Delivery Methods**: Gmail API + EmailJS fallback
- **Plan-Based Limits**: Automatic enforcement with upgrade prompts
- **Professional Templates**: Branded email layouts
- **Delivery Tracking**: Success/failure notifications

### 🎯 Email Flow Decision Tree

#### Intelligent Routing

```
Send Request → Plan Check → Method Selection → Delivery → Logging
```

**Routing Logic:**

```
Admin Users → Unlimited via any method
Pro Users → Gmail API (if connected) → EmailJS fallback
Trial Users → EmailJS (3 email limit) → Upgrade prompt
```

#### Gmail Integration Flow

```
Connect Gmail → OAuth Consent → Token Exchange → Secure Storage → Send Emails
```

**Security Implementation:**

1. **OAuth 2.0**: Secure Google authentication
2. **Server-Side Secrets**: Client secret never in browser
3. **Token Management**: Automatic refresh via Edge Functions
4. **Fallback System**: EmailJS if Gmail fails

#### Email Composition

```
Invoice Data → Template Selection → Personalization → Delivery
```

**Email Features:**

- **Professional Templates**: Branded with company details
- **PDF Attachment**: Invoice automatically attached
- **Custom Messages**: Personalized notes and terms
- **Delivery Confirmation**: Real-time status updates

---

## 💼 Business Branding & Customization

### ✨ Key Features

- **Complete Brand Identity**: Logo, colors, company details
- **Auto-Fill Integration**: Seamless invoice population
- **Multi-Currency Support**: Global business ready
- **Email Preferences**: Choose delivery methods

### 🎯 Branding Setup Flow

#### Initial Configuration

```
Profile Setup → Company Details → Logo Upload → Preferences → Integration
```

**Branding Elements:**

1. **Company Identity**: Name, logo, website, tagline
2. **Contact Information**: Address, phone, email
3. **Business Settings**: Currency, tax rates, invoice prefix
4. **Email Configuration**: Gmail connection, preferences

#### Dashboard Integration

```
Branding Settings → Auto-Fill → Invoice Creation → Consistent Experience
```

**Smart Integration:**

- **One-Time Setup**: Branding applied automatically to new invoices
- **Consistent Experience**: Same details across all invoices
- **Easy Updates**: Change once, applies everywhere
- **Professional Appearance**: Branded emails and invoices

---

## 💳 Subscription & Payment Flow

### ✨ Key Features

- **Flexible Plans**: Trial, Monthly Pro, Yearly Pro, Enterprise
- **UPI Integration**: Indian payment methods
- **Usage Tracking**: Real-time limits and notifications
- **Admin Verification**: Manual payment confirmation

### 🎯 Subscription Journey

#### Plan Selection

```
Trial Experience → Usage Limits → Upgrade Prompt → Plan Selection → Payment
```

**Plan Comparison:**
| Feature | Trial | Pro Monthly | Pro Yearly | Enterprise |
|---------|-------|-------------|------------|------------|
| Duration | 3 days | Monthly | Yearly | Custom |
| Invoices | 10 | Unlimited | Unlimited | Unlimited |
| Emails | 3 | Unlimited | Unlimited | Unlimited |
| Gmail API | ❌ | ✅ | ✅ | ✅ |
| Support | Basic | Priority | Priority | Dedicated |

#### Payment Process

```
Plan Selection → UPI QR Code → Payment → Transaction ID → Admin Verification → Activation
```

**Payment Features:**

1. **UPI Integration**: QR code generation for instant payments
2. **Manual Verification**: Admin confirms payments
3. **Instant Activation**: Immediate access after verification
4. **Billing Toggle**: Monthly/Yearly switching

---

## 👥 Customer & Inventory Management

### ✨ Key Features

- **Customer Database**: Store frequently used customer details
- **Product Catalog**: Manage inventory with pricing
- **Quick Selection**: Fast invoice population
- **Data Security**: User-specific data isolation

### 🎯 Management Flow

#### Customer Management

```
Add Customer → Store Details → Quick Select → Invoice Population
```

**Customer Features:**

- **Complete Profiles**: Name, email, address, phone
- **Quick Access**: Select from dropdown during invoice creation
- **Bulk Operations**: Import/export customer data
- **Soft Delete**: Maintain history while removing active customers

#### Product Inventory

```
Add Products → Set Pricing → Category Management → Invoice Integration
```

**Inventory Features:**

- **Product Catalog**: Name, description, unit price
- **Category Organization**: Group related products
- **Quick Add**: Select products during invoice creation
- **Price Management**: Update pricing across all invoices

---

## 📊 Analytics & Admin Features

### ✨ Key Features

- **Revenue Analytics**: MRR tracking and growth metrics
- **User Management**: Subscription and role management
- **Audit Logging**: Activity tracking and security
- **Payment Verification**: Manual subscription activation

### 🎯 Admin Dashboard Flow

#### Analytics Overview

```
Login → Admin Dashboard → Revenue Metrics → User Analytics → Growth Insights
```

**Key Metrics:**

1. **Monthly Recurring Revenue (MRR)**: Subscription revenue tracking
2. **Plan Distribution**: User distribution across plans
3. **Invoice Statistics**: Creation and delivery metrics
4. **Growth Trends**: User acquisition and retention

#### User Management

```
User List → Subscription Status → Manual Verification → Plan Activation
```

**Admin Capabilities:**

- **Subscription Management**: Activate/deactivate plans
- **Payment Verification**: Confirm UPI transactions
- **User Roles**: Assign admin privileges
- **Usage Monitoring**: Track limits and overages

---

## 🔄 Advanced Workflows

### ✨ Key Features

- **Proforma to Tax Invoice**: Seamless conversion workflow
- **Bulk Operations**: Mass actions on multiple invoices
- **Public Verification**: Customer invoice verification
- **Data Export**: Comprehensive reporting

### 🎯 Advanced Use Cases

#### Proforma to Tax Invoice Conversion

```
Create Proforma → Send to Customer → Receive Approval → Convert to Tax Invoice → Mark Paid
```

**Conversion Features:**

- **One-Click Conversion**: Automatic tax invoice generation
- **Duplicate Prevention**: Original marked as converted
- **New Invoice Number**: Fresh numbering for tax invoice
- **Status Tracking**: Clear workflow progression

#### Public Invoice Verification

```
Customer Receives Invoice → Verification Link → Public Lookup → Authenticity Confirmed
```

**Verification System:**

- **Public Access**: No login required for customers
- **Secure Lookup**: Database verification without exposing data
- **Trust Building**: Customers can verify invoice authenticity
- **Fraud Prevention**: Reduces fake invoice risks

#### Bulk Invoice Management

```
Select Multiple → Bulk Actions → Status Updates → Export Reports
```

**Bulk Capabilities:**

- **Mass Status Updates**: Change multiple invoice statuses
- **Bulk Email Sending**: Send multiple invoices at once
- **Export Operations**: Generate reports for accounting
- **Archive Management**: Organize old invoices

---

## 🎯 User Experience Highlights

### Performance Optimizations

- **Instant Navigation**: Zero loading between authenticated pages
- **Smart Caching**: Session and data caching for speed
- **Optimistic Updates**: UI updates before server confirmation
- **Progressive Loading**: Critical content first, details follow

### Mobile Experience

- **Responsive Design**: Works perfectly on all devices
- **Touch Optimized**: Mobile-friendly interactions
- **Offline Capable**: Core features work without internet
- **App-Like Feel**: PWA capabilities for mobile users

### Security & Compliance

- **GST Compliance**: All templates meet Indian tax requirements
- **Data Encryption**: End-to-end security for sensitive data
- **Role-Based Access**: Proper permission management
- **Audit Trails**: Complete activity logging for compliance
