import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SubscriptionGuard = ({ children }) => {
  const [status, setStatus] = useState('loading'); // 'loading', 'allowed', 'expired'

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // 1. Correctly fetch the user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            // Not logged in
            setStatus('expired');
            return;
        }

        // 2. --- ADMIN BYPASS ---
        // Check email OR Check DB Role
        const adminEmails = ['admin@invoiceport.com', 'nssoftwaresolutions1@gmail.com'];
        
        if (adminEmails.includes(user.email)) {
            setStatus('allowed');
            return;
        }
        
        // Double check via DB role for robustness
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        if (roleData) {
            setStatus('allowed');
            return;
        }

        // 3. Normal User Subscription Check
        const { data: sub, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!sub) {
            setStatus('expired');
            return;
        }

        const now = new Date();
        const endDate = new Date(sub.current_period_end);

        // Allow if 'active' OR ('trialing' and not expired)
        if (sub.status === 'active' || (sub.status === 'trialing' && endDate > now)) {
            setStatus('allowed');
        } else {
            setStatus('expired');
        }

      } catch (error) {
        console.error("Subscription check failed", error);
        setStatus('expired'); 
      }
    };

    checkSubscription();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (status === 'expired') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
                <div className="mx-auto bg-red-100 h-16 w-16 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Trial Expired</h1>
                <p className="text-gray-500 mb-6">
                    Your free trial has ended. Please upgrade to a paid plan to continue creating invoices.
                </p>
                <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg"
                    onClick={() => window.location.href = '/subscription'}
                >
                    View Subscription Plans
                </Button>
                <p className="mt-4 text-xs text-gray-400">
                    Need access to history? <a href="/invoice-history" className="text-indigo-600 hover:underline">View Past Invoices</a>
                </p>
            </div>
        </div>
    );
  }

  return children;
};

export default SubscriptionGuard;