# Troubleshooting Guide

## "Failed to fetch" Error on Login/Signup

This error means the app cannot connect to Supabase. Here's how to fix it:

### ✅ Solution

**You MUST add Supabase environment variables to Netlify:**

1. **Go to Netlify Dashboard**
   - Select your site
   - Click **Site Settings** → **Environment Variables**

2. **Add these two variables:**

   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY = your_supabase_anon_key
   ```

3. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Click **Settings** (gear icon) → **API**
   - Copy:
     - **Project URL** → Use as `VITE_SUPABASE_URL`
     - **anon public** key → Use as `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Redeploy your site:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**
   - Wait for build to complete

### 🔍 How to Verify It's Working

After redeploying, open your site and check the browser console (F12):

**If credentials are missing, you'll see:**

```
⚠️ CRITICAL: Supabase credentials are missing or invalid!
```

**If credentials are correct, you'll see:**

```
App component rendering...
```

### 📋 Checklist

- [ ] Added `VITE_SUPABASE_URL` to Netlify environment variables
- [ ] Added `VITE_SUPABASE_PUBLISHABLE_KEY` to Netlify environment variables
- [ ] Verified the values are correct (no typos)
- [ ] Triggered a new deploy with cache cleared
- [ ] Checked browser console for errors

## Other Common Issues

### Site Shows Configuration Error Page

**Cause:** Environment variables are not set or contain placeholder values

**Solution:** Follow the steps above to add real Supabase credentials

### Build Fails on Netlify

**Possible causes:**

1. Node version too old (need 18.x or higher)
2. Missing dependencies
3. Syntax errors in code

**Solution:**

- Check deploy logs for specific error
- Ensure Node version is 18.x or higher in Netlify settings
- Try clearing cache and redeploying

### Database Errors After Login

**Cause:** Database migrations haven't been run

**Solution:** Run migrations in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in `supabase/migrations/` folder in order
3. Start with `20250106_user_branding_system.sql`
4. End with `20260305_create_helper_functions.sql`

### Email Confirmation Not Working

**Cause:** Email settings not configured in Supabase

**Solution:**

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Verify email templates are enabled
3. Check SMTP settings if using custom email provider

## Still Having Issues?

1. **Check browser console** (F12) for error messages
2. **Check Netlify deploy logs** for build errors
3. **Verify environment variables** are spelled correctly (case-sensitive)
4. **Try incognito/private browsing** to rule out cache issues
5. **Clear browser cache and cookies** for your site

## Quick Test

To test if Supabase is configured correctly, open browser console and run:

```javascript
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "Supabase Key:",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "SET" : "NOT SET",
);
```

If both show valid values, the configuration is correct.
