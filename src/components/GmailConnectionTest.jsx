import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isGmailConnected } from '@/utils/gmailInvoiceService';
import { checkGmailConnection } from '@/utils/gmailOAuthService';

const GmailConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runConnectionTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('=== GMAIL CONNECTION TEST ===');
      
      // Test 1: Check business settings
      const { data: settings, error: settingsError } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Test 2: Check Gmail connection via service
      const gmailConnectedViaService = await isGmailConnected(user.id);
      
      // Test 3: Check Gmail connection via OAuth service
      const oauthConnectionCheck = await checkGmailConnection();

      const testResults = {
        userId: user.id,
        userEmail: user.email,
        businessSettings: {
          found: !settingsError && !!settings,
          error: settingsError?.message,
          preferredMethod: settings?.preferred_email_method,
          hasGmailRefreshToken: !!settings?.gmail_refresh_token,
          hasGmailAccessToken: !!settings?.gmail_access_token,
          gmailEmail: settings?.gmail_email,
          gmailTokenExpires: settings?.gmail_token_expires
        },
        serviceCheck: {
          connected: gmailConnectedViaService,
        },
        oauthCheck: {
          connected: oauthConnectionCheck.connected,
          error: oauthConnectionCheck.error,
          email: oauthConnectionCheck.email,
          expiresAt: oauthConnectionCheck.expiresAt
        },
        timestamp: new Date().toISOString()
      };

      console.log('Gmail Connection Test Results:', testResults);
      setResults(testResults);

      if (gmailConnectedViaService && oauthConnectionCheck.connected) {
        toast.success('Gmail connection is working properly!');
      } else {
        toast.error('Gmail connection has issues - check the results below');
      }

    } catch (error) {
      console.error('Gmail connection test failed:', error);
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
    if (status === true) return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
    if (status === false) return <Badge variant="destructive">Not Connected</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          Gmail Connection Diagnostic Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runConnectionTest} disabled={testing}>
            {testing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Run Connection Test
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

                {/* Business Settings */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    {getStatusIcon(results.businessSettings.found)}
                    Business Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Settings Found:</span>
                      {getStatusBadge(results.businessSettings.found)}
                    </div>
                    <div className="flex justify-between">
                      <span>Preferred Method:</span>
                      <Badge variant="outline">{results.businessSettings.preferredMethod || 'None'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gmail Refresh Token:</span>
                      {getStatusBadge(results.businessSettings.hasGmailRefreshToken)}
                    </div>
                    <div className="flex justify-between">
                      <span>Gmail Access Token:</span>
                      {getStatusBadge(results.businessSettings.hasGmailAccessToken)}
                    </div>
                    <div className="flex justify-between">
                      <span>Gmail Email:</span>
                      <code className="bg-white px-1 rounded text-xs">
                        {results.businessSettings.gmailEmail || 'None'}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Expires:</span>
                      <code className="bg-white px-1 rounded text-xs">
                        {results.businessSettings.gmailTokenExpires ? 
                          new Date(results.businessSettings.gmailTokenExpires).toLocaleString() : 'None'}
                      </code>
                    </div>
                  </div>
                  {results.businessSettings.error && (
                    <div className="mt-2 text-red-600 text-sm">
                      Error: {results.businessSettings.error}
                    </div>
                  )}
                </div>

                {/* Service Check */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    {getStatusIcon(results.serviceCheck.connected)}
                    Gmail Service Check
                  </h3>
                  <div className="flex justify-between">
                    <span>Connection Status:</span>
                    {getStatusBadge(results.serviceCheck.connected)}
                  </div>
                </div>

                {/* OAuth Check */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    {getStatusIcon(results.oauthCheck.connected)}
                    OAuth Connection Check
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>OAuth Connected:</span>
                      {getStatusBadge(results.oauthCheck.connected)}
                    </div>
                    <div className="flex justify-between">
                      <span>Gmail Email:</span>
                      <code className="bg-white px-1 rounded text-xs">
                        {results.oauthCheck.email || 'None'}
                      </code>
                    </div>
                    {results.oauthCheck.expiresAt && (
                      <div className="flex justify-between">
                        <span>Expires At:</span>
                        <code className="bg-white px-1 rounded text-xs">
                          {new Date(results.oauthCheck.expiresAt).toLocaleString()}
                        </code>
                      </div>
                    )}
                  </div>
                  {results.oauthCheck.error && (
                    <div className="mt-2 text-red-600 text-sm">
                      Error: {results.oauthCheck.error}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-3">Recommendations</h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    {!results.businessSettings.found && (
                      <div>• Business settings not found - this is unusual</div>
                    )}
                    {results.businessSettings.preferredMethod !== 'gmail' && (
                      <div>• Preferred email method is not set to Gmail</div>
                    )}
                    {!results.businessSettings.hasGmailRefreshToken && (
                      <div>• Gmail refresh token is missing - need to reconnect Gmail</div>
                    )}
                    {!results.oauthCheck.connected && (
                      <div>• OAuth connection failed - try reconnecting Gmail</div>
                    )}
                    {results.businessSettings.hasGmailRefreshToken && results.businessSettings.preferredMethod === 'gmail' && !results.serviceCheck.connected && (
                      <div>• All tokens present but service check failed - possible token expiry</div>
                    )}
                  </div>
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

export default GmailConnectionTest;