# Professional Invoice Email Template

## HTML Email Template for EmailJS

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice {{invoice_number}}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #f4f6f8;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial,
          sans-serif;
        color: #333;
        line-height: 1.6;
      }

      .email-container {
        max-width: 600px;
        margin: 20px auto;
        background: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .header {
        background: linear-gradient(135deg, #2563eb, #1e40af);
        color: #fff;
        padding: 30px;
        text-align: center;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .header p {
        margin: 8px 0 0;
        opacity: 0.9;
        font-size: 16px;
      }

      .content {
        padding: 30px;
      }

      .section {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }

      .section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .info-label {
        color: #666;
        font-weight: 500;
      }

      .info-value {
        color: #333;
        font-weight: 600;
      }

      .billing-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 20px 0;
      }

      .billing-box {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .billing-name {
        font-weight: 600;
        font-size: 16px;
        color: #1e293b;
        margin-bottom: 8px;
      }

      .billing-details {
        color: #475569;
        font-size: 14px;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .items-table th {
        background: #f1f5f9;
        color: #475569;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }

      .items-table td {
        padding: 15px 12px;
        border-bottom: 1px solid #f8fafc;
        color: #1e293b;
        font-size: 14px;
      }

      .item-name {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .item-description {
        font-size: 12px;
        color: #64748b;
      }

      .text-center {
        text-align: center;
      }
      .text-right {
        text-align: right;
      }

      .totals-box {
        background: #f1f5ff;
        border: 1px solid #c7d2fe;
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 15px;
      }

      .total-label {
        color: #64748b;
        font-weight: 500;
      }

      .total-value {
        color: #1e293b;
        font-weight: 600;
      }

      .grand-total {
        display: flex;
        justify-content: space-between;
        font-size: 18px;
        font-weight: bold;
        color: #1e40af;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 2px solid #2563eb;
      }

      .notes-box {
        background: #f8fafc;
        border-left: 4px solid #2563eb;
        padding: 20px;
        border-radius: 0 8px 8px 0;
        margin: 15px 0;
      }

      .notes-content {
        color: #475569;
        margin: 0;
        white-space: pre-wrap;
      }

      .footer {
        background: #1e293b;
        color: #94a3b8;
        padding: 25px;
        text-align: center;
        font-size: 13px;
      }

      .footer-company {
        color: #ffffff;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .footer-contact {
        margin-bottom: 15px;
      }

      .footer-copyright {
        opacity: 0.7;
        font-size: 12px;
      }

      @media only screen and (max-width: 600px) {
        .email-container {
          margin: 10px;
          border-radius: 8px;
        }

        .billing-grid {
          grid-template-columns: 1fr;
          gap: 15px;
        }

        .header,
        .content {
          padding: 20px;
        }

        .items-table {
          font-size: 12px;
        }

        .items-table th,
        .items-table td {
          padding: 8px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <h1>Invoice from {{company_name}}</h1>
        <p>Invoice #{{invoice_number}}</p>
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Invoice Details -->
        <div class="section">
          <div class="section-title">Invoice Details</div>
          <div class="info-row">
            <span class="info-label">Invoice Date</span>
            <span class="info-value">{{invoice_date}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date</span>
            <span class="info-value">{{due_date}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Terms</span>
            <span class="info-value">{{payment_terms}}</span>
          </div>
        </div>

        <!-- Billing Information -->
        <div class="section">
          <div class="section-title">Billing Information</div>
          <div class="billing-grid">
            <div class="billing-box">
              <div class="section-title">Bill To</div>
              <div class="billing-name">{{customer_name}}</div>
              <div class="billing-details">
                {{customer_email}}<br />
                {{#customer_phone}}{{customer_phone}}<br />{{/customer_phone}}
                {{#customer_address}}{{customer_address}}{{/customer_address}}
              </div>
            </div>

            <div class="billing-box">
              <div class="section-title">From</div>
              <div class="billing-name">{{company_name}}</div>
              <div class="billing-details">
                {{company_email}}<br />
                {{#company_phone}}{{company_phone}}<br />{{/company_phone}}
                {{#company_website}}{{company_website}}{{/company_website}}
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="section">
          <div class="section-title">Items & Services</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {{#items}}
              <tr>
                <td>
                  <div class="item-name">{{item_name}}</div>
                  {{#item_description}}
                  <div class="item-description">{{item_description}}</div>
                  {{/item_description}}
                </td>
                <td class="text-center">{{item_quantity}}</td>
                <td class="text-right">{{currency_symbol}}{{item_rate}}</td>
                <td class="text-right">{{currency_symbol}}{{item_total}}</td>
              </tr>
              {{/items}} {{^items}}
              <tr>
                <td
                  colspan="4"
                  style="text-align: center; color: #64748b; font-style: italic; padding: 20px;"
                >
                  {{items_list}}
                </td>
              </tr>
              {{/items}}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="section">
          <div class="totals-box">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">{{currency_symbol}}{{sub_total}}</span>
            </div>
            {{#discount_amount}}
            <div class="total-row">
              <span class="total-label">Discount</span>
              <span class="total-value" style="color: #059669;"
                >-{{currency_symbol}}{{discount_amount}}</span
              >
            </div>
            {{/discount_amount}} {{#tax_amount}}
            <div class="total-row">
              <span class="total-label">Tax</span>
              <span class="total-value">{{currency_symbol}}{{tax_amount}}</span>
            </div>
            {{/tax_amount}}
            <div class="grand-total">
              <span>Total Amount</span>
              <span>{{currency_symbol}}{{total_amount}}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        {{#notes}}
        <div class="section">
          <div class="section-title">Notes</div>
          <div class="notes-box">
            <div class="notes-content">{{notes}}</div>
          </div>
        </div>
        {{/notes}}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-company">{{company_name}}</div>
        <div class="footer-contact">
          {{#company_email}}{{company_email}}{{/company_email}}
          {{#company_phone}}{{#company_email}} •
          {{/company_email}}{{company_phone}}{{/company_phone}}
        </div>
        <div class="footer-copyright">
          {{email_signature}}<br />
          © {{current_year}} • Powered by InvoicePort
        </div>
      </div>
    </div>
  </body>
</html>
```

## Template Variables Reference

### Company Information

- `{{company_name}}` - Your company name
- `{{company_email}}` - Your company email
- `{{company_phone}}` - Your company phone
- `{{company_website}}` - Your company website

### Invoice Details

- `{{invoice_number}}` - Invoice number
- `{{invoice_date}}` - Invoice date
- `{{due_date}}` - Payment due date
- `{{payment_terms}}` - Payment terms (e.g., "Net 30")

### Customer Information

- `{{customer_name}}` - Customer name
- `{{customer_email}}` - Customer email
- `{{customer_phone}}` - Customer phone
- `{{customer_address}}` - Customer address

### Items (Two Options)

#### Option 1: Simple Items List

- `{{items_list}}` - Pre-formatted items list

#### Option 2: Individual Item Loop

```html
{{#items}}
<tr>
  <td>{{item_name}}</td>
  <td>{{item_description}}</td>
  <td>{{item_quantity}}</td>
  <td>{{item_rate}}</td>
  <td>{{item_total}}</td>
</tr>
{{/items}}
```

### Totals

- `{{currency_symbol}}` - Currency symbol ($, €, £, etc.)
- `{{sub_total}}` - Subtotal amount
- `{{tax_amount}}` - Tax amount (optional)
- `{{discount_amount}}` - Discount amount (optional)
- `{{total_amount}}` - Final total amount

### Additional

- `{{notes}}` - Invoice notes (optional)
- `{{email_signature}}` - Your email signature
- `{{current_year}}` - Current year

## Usage Instructions

1. **Copy the HTML** from the code block above
2. **Paste into EmailJS** template editor
3. **Save the template** with a memorable name
4. **Update your EmailJS template ID** in your app's environment variables
5. **Test the template** by sending a test invoice

## Features

- ✅ **Mobile Responsive** - Looks great on all devices
- ✅ **Professional Design** - Clean, modern layout
- ✅ **Print Friendly** - Optimized for printing
- ✅ **Conditional Sections** - Shows/hides based on data
- ✅ **Flexible Items** - Supports both simple and detailed item lists
- ✅ **Brand Colors** - Easy to customize colors
- ✅ **Cross-Client Compatible** - Works in all major email clients
