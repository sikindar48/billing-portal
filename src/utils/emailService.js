/**
 * emailService.js - Legacy EmailJS utilities
 * 
 * NOTE: This file is kept for backward compatibility but most email functionality
 * has been migrated to Resend (via Supabase edge function).
 * 
 * Current usage:
 * - Invoice sending for Trial/Free users (via userEmailService.js)
 * 
 * Migrated to Resend (via Edge Functions only):
 * - OTP / Password Reset → request-otp → send-email (service role; user never calls send-email for OTP)
 * - Subscription / welcome → supabase.functions.invoke('send-email', { Authorization: user JWT })
 * 
 * Removed:
 * - Payment verification emails (not needed - Razorpay auto-upgrades)
 */

// This file is intentionally minimal. EmailJS is only used for invoice sending now.
// All other email types have been migrated to Resend for better deliverability and security.
