# Brevo SMTP Troubleshooting Guide

## Current Issue: "Error sending confirmation email"

### Step 1: Verify Brevo SMTP Configuration

**In Supabase Dashboard:**

1. Go to **Settings** → **Authentication** → **SMTP Settings**
2. Use these Brevo settings:

```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587 (recommended) or 465 (SSL)
SMTP Username: your-brevo-login-email@domain.com
SMTP Password: YOUR_BREVO_SMTP_KEY (not login password!)
Sender Email: verified-email@yourdomain.com
Sender Name: InvoicePort
```

### Step 2: Get Your Brevo SMTP Key

**In Brevo Dashboard:**

1. Go to **Account** → **SMTP & API**
2. Find **SMTP** section
3. Copy the **SMTP Key** (looks like: xsmtpsib-abc123...)
4. **This is different from your login password!**

### Step 3: Verify Sender Email

**In Brevo Dashboard:**

1. Go to **Senders & IP** → **Senders**
2. Make sure your sender email is **verified** (green checkmark)
3. If not verified, verify it first
4. Use this exact verified email in Supabase SMTP settings

### Step 4: Test SMTP Connection

**In Supabase Dashboard:**

1. Go to **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Click **Send Test Email** (if available)
4. Check if test email is received

### Step 5: Check Brevo Logs

**In Brevo Dashboard:**

1. Go to **Logs** → **Email**
2. Check for any failed email attempts
3. Look for error messages or bounces

### Common Errors & Solutions:

#### Error: "Authentication failed"

- **Cause:** Wrong SMTP key or username
- **Solution:** Double-check SMTP key and username

#### Error: "Sender not verified"

- **Cause:** Sender email not verified in Brevo
- **Solution:** Verify sender email in Brevo dashboard

#### Error: "Connection timeout"

- **Cause:** Wrong SMTP host or port
- **Solution:** Use `smtp-relay.brevo.com` port `587`

#### Error: "Daily limit exceeded"

- **Cause:** Brevo free plan limits (300 emails/day)
- **Solution:** Upgrade Brevo plan or wait for reset

### Step 6: Alternative Test

If Supabase SMTP still doesn't work, try this:

1. **Temporarily disable email confirmations** in Supabase
2. **Test user signup** without email confirmation
3. **Check if welcome email via EmailJS works**
4. **Re-enable email confirmations** after fixing SMTP

### Brevo Free Plan Limits:

- **300 emails per day**
- **Unlimited contacts**
- **Basic templates**

### Next Steps:

1. Verify SMTP settings in Supabase
2. Test with a simple email template
3. Check Brevo logs for errors
4. Try sending a test signup email
