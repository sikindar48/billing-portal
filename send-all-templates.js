#!/usr/bin/env node

/**
 * Send all active email templates to a test address
 * Usage: node send-all-templates.js nayabsikindar48@gmail.com "Nayab Sikindar"
 *
 * Active templates:
 *   1. 🎊 Welcome          – sent on signup
 *   2. 🔐 Password Reset   – sent via forgot password OTP
 *   3. 🎉 Subscription     – sent after successful payment
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

function loadEnv() {
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=').replace(/"/g, '');
        }
      }
    });
    return envVars;
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    return {};
  }
}

async function sendEmail(supabaseUrl, serviceRoleKey, emailData, templateName) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ ${templateName} – FAILED`);
      console.error(`   Error: ${result.error || result.message}`);
      return false;
    }

    console.log(`✅ ${templateName} – SENT (id: ${result.id})`);
    return true;
  } catch (error) {
    console.error(`❌ ${templateName} – ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('📧 InvoicePort – Send All Email Templates\n');
  console.log('═══════════════════════════════════════════\n');

  const env             = loadEnv();
  const supabaseUrl     = env.VITE_SUPABASE_URL;
  const serviceRoleKey  = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('   (send-email now requires a user JWT or the service role — use the service role for this script only.)');
    process.exit(1);
  }

  const testEmail = process.argv[2] || 'nayabsikindar48@gmail.com';
  const userName  = process.argv[3] || 'Nayab Sikindar';

  console.log(`📬 Recipient : ${testEmail}`);
  console.log(`👤 User Name : ${userName}`);
  console.log(`🔗 Supabase  : ${supabaseUrl}\n`);
  console.log('═══════════════════════════════════════════\n');

  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const results = [];

  // 1. Welcome Email
  console.log('📨 Sending Welcome Email...');
  results.push(await sendEmail(supabaseUrl, serviceRoleKey, {
    type: 'welcome',
    to: testEmail,
    user_name: userName,
  }, 'Welcome Email'));
  console.log('');

  await delay(2000);

  // 2. Password Reset OTP
  console.log('📨 Sending Password Reset OTP...');
  const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
  results.push(await sendEmail(supabaseUrl, serviceRoleKey, {
    type: 'otp',
    to: testEmail,
    otp_code: resetOTP,
    purpose: 'password_reset',
    expires_in: '10 minutes',
  }, 'Password Reset OTP'));
  console.log(`   OTP Code: ${resetOTP}`);
  console.log('');

  await delay(2000);

  // 3. Subscription Confirmation
  console.log('📨 Sending Subscription Confirmation...');
  results.push(await sendEmail(supabaseUrl, serviceRoleKey, {
    type: 'subscription_confirmation',
    to: testEmail,
    user_name: userName,
    plan_name: 'Pro Plan - Monthly',
    amount: 299,
    billing_cycle: 'Monthly',
    period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, 'Subscription Confirmation'));
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════\n');
  const passed = results.filter(Boolean).length;
  console.log(`📊 ${passed}/${results.length} templates sent successfully`);

  if (passed === results.length) {
    console.log('\n🎉 All done! Check your inbox at:', testEmail);
    console.log('   1. 🎊 Welcome Email');
    console.log('   2. 🔐 Password Reset OTP');
    console.log('   3. 🎉 Subscription Confirmation');
  } else {
    console.log('\n⚠️  Some emails failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);
