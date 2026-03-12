# Netlify Deployment Setup Guide

## ⚠️ CRITICAL: Environment Variables Required

Your site is blank because **Supabase environment variables are missing**. You must add these in Netlify:

### Required Environment Variables

Go to: **Netlify Dashboard → Site Settings → Environment Variables**

Add these variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon)
3. Go to **API** section
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_PUBLISHABLE_KEY`

### Optional Environment Variables (for email features)

```
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_WELCOME_TEMPLATE_ID=your_welcome_template_id
VITE_EMAILJS_PAYMENT_VERIFICATION_TEMPLATE_ID=your_payment_template_id
VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=your_password_reset_template_id

VITE_ADMIN_EMAILJS_SERVICE_ID=your_admin_service_id
VITE_ADMIN_EMAILJS_PUBLIC_KEY=your_admin_public_key

VITE_GMAIL_CLIENT_ID=your_google_client_id
VITE_GMAIL_CLIENT_SECRET=your_google_client_secret
```

## Build Settings

These should already be configured in `netlify.toml`:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18.x or higher

## After Adding Environment Variables

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for the build to complete
4. Your site should now work!

## Troubleshooting

### Site is still blank after adding env vars

- Make sure you triggered a new deploy after adding variables
- Check the deploy logs for any build errors
- Verify the environment variables are spelled correctly (case-sensitive)

### Build fails

- Check Node version is 18.x or higher
- Clear cache and retry deploy
- Check deploy logs for specific error messages

### Database errors

- Run the migrations in `supabase/migrations/` folder
- Make sure your Supabase project is active
- Check RLS policies are enabled

## Current Status

✅ Code pushed to GitHub
✅ Netlify configuration ready
⚠️ **ACTION REQUIRED:** Add Supabase environment variables
⚠️ **ACTION REQUIRED:** Run database migrations

## Database Migrations

You need to run these migrations in your Supabase SQL Editor:

1. `20250106_user_branding_system.sql`
2. `20250120_email_usage_tracking.sql`
3. `20251118081815_2b0f0dd3-5b3e-4229-8b4a-d41cee1f7120.sql`
4. `20251118084323_a879535f-613f-43bc-ad4c-8a65e707b5f2.sql`
5. `20260220_create_audit_logs_table.sql`
6. `20260220_create_rpc_functions.sql`
7. `20260220_fix_invoice_status.sql`
8. `20260305_create_invoices_table.sql`
9. `20260305_create_helper_functions.sql`

Run them in order in your Supabase SQL Editor.
