# Order Confirmation Email Template for EmailJS

## Template Configuration

### Template Settings:

- **Template ID**: `order_confirmation`
- **Subject**: `Order Confirmed - Welcome to {{plan_name}} Plan!`
- **To Email**: `{{to_email}}`
- **From Name**: `InvoicePort`
- **From Email**: `info.invoiceport@gmail.com`

### HTML Template:

```html
<div
  style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif;"
>
  <!-- Header -->
  <div
    style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;"
  >
    <img
      src="https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp"
      alt="InvoicePort Logo"
      style="height: 40px; margin-bottom: 20px;"
    />
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
      Order Confirmed! 🎉
    </h1>
    <p
      style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;"
    >
      Welcome to {{plan_name}} Plan
    </p>
  </div>

  <!-- Content -->
  <div style="padding: 40px 30px;">
    <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 22px;">
      Hi {{to_name}},
    </h2>
    <p
      style="color: #4a5568; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;"
    >
      Thank you for your order! We're excited to confirm that your subscription
      to the
      <strong>{{plan_name}}</strong> plan has been successfully activated.
    </p>

    <!-- Order Details Card -->
    <div
      style="background-color: #f0fff4; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #10b981;"
    >
      <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">
        ✅ Order Details
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 5px 0; color: #065f46;">
            <strong>Order Number:</strong> {{order_number}}
          </p>
          <p style="margin: 5px 0; color: #065f46;">
            <strong>Order Date:</strong> {{order_date}}
          </p>
          <p style="margin: 5px 0; color: #065f46;">
            <strong>Plan:</strong> {{plan_name}}
          </p>
        </div>
        <div>
          <p style="margin: 5px 0; color: #065f46;">
            <strong>Amount Paid:</strong> {{amount_paid}}
          </p>
          <p style="margin: 5px 0; color: #065f46;">
            <strong>Payment Method:</strong> {{payment_method}}
          </p>
          <p style="margin: 5px 0; color: #065f46;">
            <strong>Billing Cycle:</strong> {{billing_cycle}}
          </p>
        </div>
      </div>
    </div>

    <!-- What's Next -->
    <div
      style="background-color: #eff6ff; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #3b82f6;"
    >
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">
        🚀 What's Next?
      </h3>
      <ul
        style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.8;"
      >
        <li>Your account has been upgraded immediately</li>
        <li>Start creating unlimited invoices right away</li>
        <li>Access all premium features and templates</li>
        <li>Next billing date: <strong>{{next_billing_date}}</strong></li>
      </ul>
    </div>

    <!-- Support -->
    <div
      style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #f59e0b;"
    >
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Need Help?</strong> Our support team is here to help you get the
        most out of your subscription. Contact us at
        <a href="mailto:{{company_email}}" style="color: #667eea;"
          >{{company_email}}</a
        >
      </p>
    </div>

    <p
      style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;"
    >
      Thank you for choosing InvoicePort! We're excited to help you streamline
      your invoicing process.
    </p>
  </div>

  <!-- Footer -->
  <div
    style="background-color: #edf2f7; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;"
  >
    <p style="color: #a0aec0; margin: 0; font-size: 12px;">
      © {{current_year}} {{company_name}}. All rights reserved.
    </p>
  </div>
</div>
```

## Template Variables

- `{{to_email}}` - Customer's email address
- `{{to_name}}` - Customer's name
- `{{order_number}}` - Order/transaction number
- `{{order_date}}` - Date of order
- `{{plan_name}}` - Subscription plan name
- `{{amount_paid}}` - Amount paid for the subscription
- `{{payment_method}}` - Payment method used (UPI, Card, etc.)
- `{{billing_cycle}}` - Billing frequency (Monthly, Yearly)
- `{{next_billing_date}}` - Next billing date
- `{{company_name}}` - Company name (InvoicePort)
- `{{company_email}}` - Support email
- `{{current_year}}` - Current year

## Setup Instructions

1. **Create EmailJS Template:**

   - Go to EmailJS Dashboard → Email Templates
   - Create new template with ID: `order_confirmation`
   - Copy the HTML above into the template content
   - Set subject: `Order Confirmed - Welcome to {{plan_name}} Plan!`

2. **Update .env File:**
   ```env
   VITE_EMAILJS_ORDER_CONFIRMATION_TEMPLATE_ID="order_confirmation"
   ```

## Usage

This template is used for:

- When admin approves paid subscription requests
- When admin upgrades users to paid plans from the dashboard
- Confirms the "order" (plan upgrade/activation) to the user
- Serves as both order confirmation and plan upgrade notification
