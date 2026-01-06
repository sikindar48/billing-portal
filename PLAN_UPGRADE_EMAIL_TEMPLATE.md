# Plan Upgrade Email Template for EmailJS

## Template Configuration

### Template Settings:

- **Template ID**: `plan_upgrade`
- **Subject**: `Plan Upgraded - Welcome to {{new_plan}}!`
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
    style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;"
  >
    <img
      src="https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp"
      alt="InvoicePort Logo"
      style="height: 40px; margin-bottom: 20px;"
    />
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
      Plan Upgraded! 🚀
    </h1>
    <p
      style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;"
    >
      You're now on {{new_plan}}
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
      Great news! Your subscription has been upgraded from
      <strong>{{old_plan}}</strong> to <strong>{{new_plan}}</strong>. Your new
      features are now active and ready to use!
    </p>

    <!-- Upgrade Details Card -->
    <div
      style="background-color: #faf5ff; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #8b5cf6;"
    >
      <h3 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 18px;">
        ✨ Upgrade Details
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <p style="margin: 5px 0; color: #6b21a8;">
            <strong>Previous Plan:</strong> {{old_plan}}
          </p>
          <p style="margin: 5px 0; color: #6b21a8;">
            <strong>New Plan:</strong> {{new_plan}}
          </p>
          <p style="margin: 5px 0; color: #6b21a8;">
            <strong>Upgrade Date:</strong> {{upgrade_date}}
          </p>
        </div>
        <div>
          <p style="margin: 5px 0; color: #6b21a8;">
            <strong>New Price:</strong> {{new_price}}
          </p>
          <p style="margin: 5px 0; color: #6b21a8;">
            <strong>Effective:</strong> {{effective_date}}
          </p>
          <p style="margin: 5px 0; color: #6b21a8;">
            <strong>Next Billing:</strong> {{next_billing_date}}
          </p>
        </div>
      </div>
    </div>

    <!-- New Features -->
    <div
      style="background-color: #ecfdf5; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #10b981;"
    >
      <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">
        🎯 What's New in Your Plan
      </h3>
      <ul
        style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.8;"
      >
        <li>Unlimited invoice creation</li>
        <li>Advanced template customization</li>
        <li>Priority customer support</li>
        <li>Enhanced branding options</li>
        <li>Detailed analytics and reporting</li>
      </ul>
    </div>

    <!-- Billing Information -->
    <div
      style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;"
    >
      <p style="color: #1e40af; margin: 0; font-size: 14px;">
        <strong>Billing Update:</strong> Your next billing cycle will reflect
        the new plan pricing. The upgrade is effective immediately, and you can
        start using all new features right away.
      </p>
    </div>

    <p
      style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;"
    >
      Thank you for upgrading! If you have any questions about your new plan,
      please contact us at
      <a href="mailto:{{company_email}}" style="color: #667eea;"
        >{{company_email}}</a
      >
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

- `{{to_email}}` - User's email address
- `{{to_name}}` - User's name
- `{{old_plan}}` - Previous subscription plan
- `{{new_plan}}` - New subscription plan
- `{{upgrade_date}}` - Date of upgrade
- `{{effective_date}}` - When the upgrade takes effect
- `{{next_billing_date}}` - Next billing date
- `{{new_price}}` - New plan pricing
- `{{company_name}}` - Company name (InvoicePort)
- `{{company_email}}` - Support email
- `{{current_year}}` - Current year

## Setup Instructions

1. **Create EmailJS Template:**

   - Go to EmailJS Dashboard → Email Templates
   - Create new template with ID: `plan_upgrade`
   - Copy the HTML above into the template content
   - Set subject: `Plan Upgraded - Welcome to {{new_plan}}!`

2. **Update .env File:**
   ```env
   VITE_EMAILJS_PLAN_UPGRADE_TEMPLATE_ID="plan_upgrade"
   ```
