# InvoicePort Pricing Reference

## Current Pricing Structure

### Pro Plan Pricing:

- **Monthly**: ₹149/month
- **Yearly**: ₹1499/year (Save ₹289/year)

### Free Trial:

- **Duration**: 3 days
- **Invoice Limit**: 10 invoices
- **Price**: Free

### Enterprise:

- **Price**: Custom pricing
- **Contact**: Sales team for quote

## Files Updated:

### ✅ SubscriptionPage.jsx

- Monthly Pro: ₹149
- Yearly Pro: ₹1499
- Displays correct pricing in UI

### ✅ AdminDashboard.jsx

- Order confirmation emails now use correct amounts
- Monthly Pro: ₹149
- Yearly Pro: ₹1499
- Enterprise: "Custom Pricing" (no fixed amount)
- Billing cycle shows "Custom" for Enterprise plans
- Fixed both approval and manual upgrade functions

## Email Template Variables:

When admin approves subscriptions or upgrades users, the email will now show:

**For Pro Plans:**

- `{{amount_paid}}` = ₹149 (monthly) or ₹1499 (yearly)
- `{{plan_name}}` = Pro
- `{{billing_cycle}}` = Monthly or Yearly

**For Enterprise Plans:**

- `{{amount_paid}}` = Custom Pricing
- `{{plan_name}}` = Enterprise
- `{{billing_cycle}}` = Custom

## Consistency Check:

All pricing references should use:

- ₹149 for monthly Pro plan
- ₹1499 for yearly Pro plan
- Free for trial/starter plan
- Custom for enterprise plan

## Notes:

- Yearly plan saves ₹289 compared to 12 months of monthly billing
- All amounts include currency symbol (₹) for Indian Rupees
- Email templates will now display correct amounts in order confirmations
