import React from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const SubscriptionGuard = ({ children }) => {
  const { subscriptionStatus, authLoading } = useAuth();

  // Only block if we're still waiting for the very first auth resolution
  // (no cached session). Once authLoading is false, never show a spinner —
  // subscription status resolves in the background.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (subscriptionStatus === 'expired') {    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
          <div className="mx-auto bg-red-100 h-16 w-16 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trial Expired</h1>
          <p className="text-gray-500 mb-6">
            Your free trial has ended. Please upgrade to a paid plan to continue.
          </p>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg"
            onClick={() => window.location.href = '/subscription'}
          >
            View Subscription Plans
          </Button>
          <p className="mt-4 text-xs text-gray-400">
            Need access to history?{' '}
            <a href="/invoice-history" className="text-indigo-600 hover:underline">View Past Invoices</a>
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default SubscriptionGuard;
