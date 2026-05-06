/**
 * Razorpay Integration Diagnostics
 * Run this to check if Razorpay is properly configured
 */

import { supabase } from '@/integrations/supabase/client';

export const runRazorpayDiagnostics = async () => {
  console.log('🔍 Running Razorpay Diagnostics...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Check 1: Supabase URL
  console.log('1️⃣ Checking Supabase URL...');
  if (import.meta.env.VITE_SUPABASE_URL) {
    console.log('✅ Supabase URL is configured:', import.meta.env.VITE_SUPABASE_URL);
    results.passed.push('Supabase URL configured');
  } else {
    console.error('❌ Supabase URL is missing');
    results.failed.push('Supabase URL missing');
  }

  // Check 2: User session
  console.log('\n2️⃣ Checking user session...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      console.log('✅ User is authenticated:', session.user.email);
      results.passed.push('User authenticated');
    } else {
      console.error('❌ No active session found');
      results.failed.push('User not authenticated');
    }
  } catch (error) {
    console.error('❌ Session check failed:', error);
    results.failed.push('Session check error: ' + error.message);
  }

  // Check 3: Edge Function connectivity
  console.log('\n3️⃣ Testing Edge Function connectivity...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('❌ Cannot test Edge Function without authentication');
      results.failed.push('Cannot test Edge Function - not authenticated');
    } else {
      const testPlan = {
        slug: 'monthly',
        price: 149,
        name: 'Pro Monthly'
      };

      console.log('📡 Calling razorpay-create-order Edge Function...');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            planSlug: testPlan.slug,
            planPrice: testPlan.price,
            planName: testPlan.name,
          }),
        }
      );

      console.log('📥 Response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('✅ Edge Function is working!');
        console.log('✅ Razorpay Key ID:', result.keyId);
        console.log('✅ Order created:', result.orderId);
        results.passed.push('Edge Function working');
        results.passed.push('Razorpay credentials configured');
      } else {
        const error = JSON.parse(responseText);
        console.error('❌ Edge Function error:', error);
        
        if (error.error?.includes('Razorpay credentials')) {
          results.failed.push('Razorpay credentials not configured in Supabase');
          console.error('\n⚠️  SOLUTION: Set Razorpay secrets in Supabase:');
          console.error('   supabase secrets set RAZORPAY_KEY_ID=your_key_id');
          console.error('   supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret');
        } else if (error.error?.includes('not found') || response.status === 404) {
          results.failed.push('Edge Function not deployed');
          console.error('\n⚠️  SOLUTION: Deploy Edge Functions:');
          console.error('   bash deploy-payment-functions.sh');
        } else {
          results.failed.push('Edge Function error: ' + error.error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Edge Function test failed:', error);
    results.failed.push('Edge Function connectivity error: ' + error.message);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('\n⚠️  This might be a CORS or network issue');
      results.warnings.push('Check network connection and CORS configuration');
    }
  }

  // Check 4: Razorpay script loading
  console.log('\n4️⃣ Testing Razorpay script loading...');
  try {
    if (window.Razorpay) {
      console.log('✅ Razorpay SDK already loaded');
      results.passed.push('Razorpay SDK available');
    } else {
      console.log('⏳ Loading Razorpay SDK...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log('✅ Razorpay SDK loaded successfully');
          results.passed.push('Razorpay SDK loaded');
          resolve();
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load Razorpay SDK:', error);
          results.failed.push('Razorpay SDK loading failed');
          results.warnings.push('Check if ad blockers are blocking Razorpay');
          reject(error);
        };
        document.body.appendChild(script);
      });
    }
  } catch (error) {
    console.error('❌ Razorpay SDK test failed:', error);
    results.failed.push('Razorpay SDK error: ' + error.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED (' + results.passed.length + '):');
    results.passed.forEach(item => console.log('   ✓', item));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED (' + results.failed.length + '):');
    results.failed.forEach(item => console.log('   ✗', item));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (' + results.warnings.length + '):');
    results.warnings.forEach(item => console.log('   ⚠', item));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('🎉 All checks passed! Razorpay should be working.');
  } else {
    console.log('⚠️  Please fix the failed checks above.');
  }
  
  return results;
};

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  window.runRazorpayDiagnostics = runRazorpayDiagnostics;
}
