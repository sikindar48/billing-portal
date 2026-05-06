/**
 * emailService.js - Legacy EmailJS utilities
 * 
 * NOTE: This file is kept for backward compatibility but most email functionality
 * has been migrated to Resend (via Supabase edge function).
 * 
 * Current usage:
 * - Invoice sending for Trial/Free users (via userEmailService.js)
 * 
 * Migrated to Resend:
 * - OTP / Password Reset → supabase/functions/send-email (type: 'otp')
 * - Subscription confirmation → supabase/functions/send-email (type: 'subscription_confirmation')
 * 
 * Removed:
 * - Payment verification emails (not needed - Razorpay auto-upgrades)
 */

// This file is intentionally minimal. EmailJS is only used for invoice sending now.
// All other email types have been migrated to Resend for better deliverability and security.
