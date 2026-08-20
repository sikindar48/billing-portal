<div align="center">

# InvoicePort

### GST-ready invoicing for modern businesses

Create professional invoices, manage customers and products, track payments, and run your billing workflow from one simple platform.

<br />

<a href="https://www.invoiceport.live">
  <img src="https://img.shields.io/badge/LIVE%20PRODUCT-0891B2?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Product" />
</a>
&nbsp;
<a href="https://github.com/sikindar48/billing-portal">
  <img src="https://img.shields.io/badge/SOURCE%20CODE-020617?style=for-the-badge&logo=github&logoColor=white" alt="Source Code" />
</a>

<br />
<br />

<img
  src="https://skillicons.dev/icons?i=react,js,supabase,tailwind,vite&perline=5&theme=light"
  alt="Technology stack"
/>

</div>

---

## Overview

**InvoicePort** is a web-based billing and invoicing platform built for freelancers, professionals, and small businesses.

The platform brings invoice creation, customer management, product management, payment tracking, PDF generation, email delivery, subscriptions, and business branding into a single workflow.

It is designed around a simple goal:

> **Make professional invoicing fast, reliable, and accessible for growing businesses.**

The application supports GST-oriented invoicing, multiple invoice templates, different currencies, invoice history, payment recording, public invoice verification, and subscription-based access.

---

## Features

### Invoice Management

- Create professional invoices
- GST-oriented invoice templates
- Tax Invoice and Proforma Invoice support
- Automatic subtotal and tax calculations
- CGST, SGST, and IGST support
- Automatic round-off calculation
- Multiple invoice templates
- Invoice numbering
- Invoice status management
- Duplicate and conversion protection
- Invoice PDF generation
- Invoice regeneration
- Bulk invoice operations

### Customer Management

- Create and manage customers
- Store customer contact information
- GSTIN support
- Quick customer selection while creating invoices
- Customer-specific invoice history
- Search and filtering

### Product & Service Management

- Product/service catalog
- Pricing management
- Quick selection while creating invoices
- CRUD operations
- Soft-delete support

### Payments

- Record invoice payments
- Track payment amount and date
- Payment status management
- Razorpay integration
- UPI payment support
- Subscription checkout
- Server-side payment verification
- Payment order tracking

### Email Delivery

InvoicePort supports automated invoice delivery through email.

- Professional email templates
- PDF invoice attachments
- Gmail integration
- Resend-powered transactional email
- Gmail OAuth authentication
- Automatic token refresh
- Test email functionality
- Email usage tracking
- Plan-based email limits

### Business Branding

Customize invoices and communications with your own business identity.

- Company name
- Company logo
- Company details
- Tagline
- Invoice branding
- Email preferences
- Business information auto-fill

### Subscription System

- Free trial
- Pro monthly plan
- Pro yearly plan
- Razorpay subscription payments
- Automatic subscription activation
- Usage tracking
- Feature limits
- Upgrade prompts
- Subscription management

### PDF & QR Features

- Professional invoice PDFs
- Multiple invoice designs
- QR code generation
- Payment/verification QR support
- PDF download
- PDF regeneration
- Invoice sharing

### Admin Dashboard

The platform includes an administration layer for managing the application.

- User management
- Subscription management
- Payment management
- Subscription requests
- Audit logs
- Infrastructure health checks
- Email usage monitoring
- Broadcast email system
- Admin-level feature access
- User plan management

### Public Features

- Public invoice verification
- Responsive design
- PWA support
- SEO metadata
- Sitemap
- Structured data
- Privacy Policy
- Terms of Service
- Custom 404 page

---

## Invoice Workflow

```text
Create Account
      │
      ▼
Activate Trial / Subscription
      │
      ▼
Configure Business
      │
      ├── Add Customers
      │
      └── Add Products / Services
                │
                ▼
          Create Invoice
                │
                ▼
        Calculate Taxes
                │
                ▼
          Generate PDF
                │
        ┌───────┴────────┐
        ▼                ▼
     Download          Email
        │                │
        └───────┬────────┘
                ▼
          Track Payment
                │
                ▼
        Invoice History
