#!/bin/bash

# Deploy Payment Edge Functions to Supabase
# This script deploys the Razorpay payment functions

echo "🚀 Deploying Payment Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Deploy razorpay-create-order function
echo "📦 Deploying razorpay-create-order..."
supabase functions deploy razorpay-create-order --no-verify-jwt

# Deploy verify-payment-and-activate function
echo "📦 Deploying verify-payment-and-activate..."
supabase functions deploy verify-payment-and-activate --no-verify-jwt

echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: Make sure Razorpay secrets are set:"
echo "   supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id"
echo "   supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret"
echo ""
echo "📝 Verify secrets are set:"
echo "   supabase secrets list"
