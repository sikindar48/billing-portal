// Test script for the activate-subscription Edge Function
// Run this after deploying the function to verify it works

const SUPABASE_URL = 'https://twfoqvxlhxhdulqchjbq.supabase.co';

// Test data - replace with actual values when testing
const testData = {
  userId: 'test-user-id', // Replace with actual user ID
  planSlug: 'monthly',
  paymentId: 'test_payment_123',
  planPrice: 149,
  planName: 'Pro Monthly'
};

// You'll need a valid user session token for testing
const userToken = 'your-user-session-token-here';

async function testEdgeFunction() {
  try {
    console.log('Testing activate-subscription Edge Function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/activate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Edge Function test successful!');
    } else {
      console.log('❌ Edge Function test failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Uncomment to run the test
// testEdgeFunction();

console.log('To test the Edge Function:');
console.log('1. Replace testData.userId with a real user ID');
console.log('2. Replace userToken with a valid session token');
console.log('3. Uncomment the testEdgeFunction() call');
console.log('4. Run: node test.js');