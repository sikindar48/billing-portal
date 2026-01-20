import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { checkEmailUsageLimit, getAvailableEmailMethods } from '@/utils/emailUsageService';

const PlanDetectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runPlanTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('=== PLAN DETECTION TEST ===');
      
      // Test 1: Direct RPC call
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_email_limit');
      
      // Test 2: Check email usage limit service
      const usageLimit = await checkEmailUsageLimit(user.id);
      
      // Test 3: Get available email methods
      const availableMethods = await getAvailableEmailMethods();
      
      // Test 4: Check user subscriptions directly
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', user.id);
      
      // Test 5: Check user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      const testResults = {
        userId: user.id,
        userEmail: user.email,
        rpcCall: {
          success: !rpcError,
          error: rpcError?.message,
          data: rpcData
        },
        usageLimit: usageLimit,
        availableMethods: availableMethods,
        subscriptions: {
          success: !subError,
          error: subError?.message,
          data: subscriptions
        },
        roles: {
          success: !rolesError,
          error: rolesError?.message,
          data: roles
        },
        timestamp: new Date().toISOString()
      };

      console.log('Plan Detection Test Results:', testResults);
      setResults(testResults);

      if (usageLimit.isPro || usageLimit.isAdmin) {
        toast.success('Pro/Admin plan detected successfully!');
      } else {
        toast.warning('Plan detected as Trial - this might be the issue');
      }

    } catch (error) {
      console.error('Plan detection test failed:', error);
      toast.error(`Test failed: ${error.message}`);
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === false) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBadge = (status) => {
    if (status === true) return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
    if (status === false) return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-500" />
          Plan Detection Diagnostic Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runPlanTest} disabled={testing}>
            {testing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Run Plan Detection Test
          </Button>
        </div>

        {results && (
          <div className="space-y-6">
            {results.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Test Failed</h3>
                <p className="text-red-600">{results.error}</p>
              </div>
            ) : (
              <>
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">User Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>User ID: <code className="bg-white px-1 rounded">{results.userId}</code></div>
                    <div>Email: <code className="bg-white px-1 rounded">{results.userEmail}</code></div>
                  </div>
                </div>

                {/* RPC Call Test */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    {getStatusIcon(results.rpcCall.success)}
                    Database RPC Call (check_email_limit)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>RPC Success:</span>
                      {getStatusBadge(results.rpcCall.success)}
                    </div>
                    {results.rpcCall.error && (
                      <div className="text-red-600 text-sm">Error: {results.rpcCall.error}</div>
                    )}
                    {results.rpcCall.data && (
                      <div className="bg-white p-2 rounded text-xs">
                        <pre>{JSON.stringify(results.rpcCall.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Limit Service */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-3">Email Usage Limit Service</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Can Send Email:</span>
                      {getStatusBadge(results.usageLimit.canSendEmail)}
                    </div>
                    <div className="flex justify-between">
                      <span>Is Pro:</span>
                      {getStatusBadge(results.usageLimit.isPro)}
                    </div>
                    <div className="flex justify-between">
                      <span>Is Admin:</span>
                      {getStatusBadge(results.usageLimit.isAdmin)}
                    </div>
                    <div className="flex justify-between">
                      <span>Plan Name:</span>
                      <Badge variant="outline">{results.usageLimit.planName}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Usage:</span>
                      <span>{results.usageLimit.currentUsage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Limit:</span>
                      <span>{results.usageLimit.emailLimit}</span>
                    </div>
                  </div>
                </div>

                {/* Available Methods */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-800 mb-3">Available Email Methods</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>EmailJS:</span>
                      {getStatusBadge(results.availableMethods.emailjs)}
                    </div>
                    <div className="flex justify-between">
                      <span>Gmail:</span>
                      {getStatusBadge(results.availableMethods.gmail)}
                    </div>
                    <div className="flex justify-between">
                      <span>Professional:</span>
                      {getStatusBadge(results.availableMethods.professional)}
                    </div>
                    <div className="flex justify-between">
                      <span>Unlimited:</span>
                      {getStatusBadge(results.availableMethods.unlimited)}
                    </div>
                  </div>
                  {results.availableMethods.restriction && (
                    <div className="mt-2 text-red-600 text-sm">
                      Restriction: {results.availableMethods.restriction}
                    </div>
                  )}
                </div>

                {/* Subscriptions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                    {getStatusIcon(results.subscriptions.success)}
                    User Subscriptions
                  </h3>
                  {results.subscriptions.error && (
                    <div className="text-red-600 text-sm mb-2">Error: {results.subscriptions.error}</div>
                  )}
                  {results.subscriptions.data && results.subscriptions.data.length > 0 ? (
                    <div className="space-y-2">
                      {results.subscriptions.data.map((sub, index) => (
                        <div key={index} className="bg-white p-2 rounded text-sm">
                          <div>Plan: {sub.subscription_plans?.name || 'Unknown'}</div>
                          <div>Status: {sub.status}</div>
                          <div>Email Usage: {sub.email_usage_count}/{sub.email_limit}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm">No subscriptions found</div>
                  )}
                </div>

                {/* User Roles */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
                    {getStatusIcon(results.roles.success)}
                    User Roles
                  </h3>
                  {results.roles.error && (
                    <div className="text-red-600 text-sm mb-2">Error: {results.roles.error}</div>
                  )}
                  {results.roles.data && results.roles.data.length > 0 ? (
                    <div className="space-y-2">
                      {results.roles.data.map((role, index) => (
                        <div key={index} className="bg-white p-2 rounded text-sm">
                          <div>Role: {role.role}</div>
                          <div>Created: {new Date(role.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm">No roles found</div>
                  )}
                </div>
              </>
            )}

            <div className="text-xs text-gray-500">
              Test completed at: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanDetectionTest;