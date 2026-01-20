import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { checkEmailUsageLimit, logEmailUsage } from '@/utils/emailUsageService';
import { toast } from 'sonner';

const EmailUsageDebug = () => {
  const [userId, setUserId] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadUsageData(user.id);
        await loadSubscriptionData(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUsageData = async (uid) => {
    try {
      const usage = await checkEmailUsageLimit(uid);
      setUsageData(usage);
      console.log('Usage data:', usage);
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const loadSubscriptionData = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', uid)
        .single();

      if (error) {
        console.error('Subscription query error:', error);
        setSubscriptionData({ error: error.message });
      } else {
        setSubscriptionData(data);
        console.log('Subscription data:', data);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setSubscriptionData({ error: error.message });
    }
  };

  const testEmailLog = async () => {
    setLoading(true);
    try {
      const result = await logEmailUsage(
        null, // no invoice ID
        'test@example.com',
        'emailjs',
        'sent',
        null
      );
      
      console.log('Test email log result:', result);
      toast.success('Test email logged successfully');
      
      // Refresh data
      await loadUsageData(userId);
      await loadSubscriptionData(userId);
    } catch (error) {
      console.error('Test email log error:', error);
      toast.error('Test email log failed');
    } finally {
      setLoading(false);
    }
  };

  const resetUsage = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ email_usage_count: 0 })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast.success('Usage reset successfully');
      await loadUsageData(userId);
      await loadSubscriptionData(userId);
    } catch (error) {
      console.error('Reset usage error:', error);
      toast.error('Reset usage failed');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    setLoading(true);
    try {
      // Get trial plan ID
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', 'trial')
        .single();

      if (!plans) {
        throw new Error('Trial plan not found');
      }

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 3);

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: plans.id,
          status: 'trialing',
          current_period_end: trialEndDate.toISOString(),
          email_usage_count: 0,
          email_limit: 3
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      toast.success('Subscription created/updated successfully');
      await loadUsageData(userId);
      await loadSubscriptionData(userId);
    } catch (error) {
      console.error('Create subscription error:', error);
      toast.error('Create subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Email Usage Debug</h3>
      
      {/* User Info */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">User Info</h4>
        <p className="text-sm text-gray-600">User ID: {userId || 'Not loaded'}</p>
      </div>

      {/* Usage Data */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2">Email Usage Data</h4>
        {usageData ? (
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(usageData, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-gray-600">Loading...</p>
        )}
      </div>

      {/* Subscription Data */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium mb-2">Subscription Data</h4>
        {subscriptionData ? (
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(subscriptionData, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-gray-600">Loading...</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={loadUserData} variant="outline" size="sm">
          Refresh Data
        </Button>
        <Button onClick={testEmailLog} disabled={loading} size="sm">
          Test Email Log
        </Button>
        <Button onClick={resetUsage} disabled={loading} variant="outline" size="sm">
          Reset Usage
        </Button>
        <Button onClick={createSubscription} disabled={loading} size="sm">
          Create/Fix Subscription
        </Button>
      </div>
    </div>
  );
};

export default EmailUsageDebug;