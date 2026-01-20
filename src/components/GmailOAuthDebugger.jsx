import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const GmailOAuthDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const collectDebugInfo = () => {
    setLoading(true);
    
    const currentOrigin = window.location.origin;
    const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GMAIL_CLIENT_SECRET;
    
    // Determine redirect URI using same logic as OAuth service
    let redirectUri;
    if (currentOrigin.includes('localhost') || currentOrigin.includes('192.168') || currentOrigin.includes('127.0.0.1')) {
      redirectUri = 'http://localhost:8080/gmail-callback';
    } else {
      redirectUri = `${currentOrigin}/gmail-callback`;
    }

    const info = {
      currentOrigin,
      redirectUri,
      clientId: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
      clientSecretSet: !!clientSecret,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      currentUrl: window.location.href
    };

    setDebugInfo(info);
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const testOAuthUrl = () => {
    const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
    if (!clientId) {
      toast.error('Gmail Client ID not configured');
      return;
    }

    const redirectUri = debugInfo?.redirectUri || 'http://localhost:8080/gmail-callback';
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    console.log('OAuth URL:', authUrl.toString());
    toast.info('OAuth URL logged to console');
    
    // Open in new tab for testing
    window.open(authUrl.toString(), '_blank');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Gmail OAuth Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={collectDebugInfo} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Collect Debug Info
          </Button>
          <Button onClick={testOAuthUrl} variant="outline" disabled={!debugInfo}>
            Test OAuth URL
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Origin</label>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {debugInfo.currentOrigin}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(debugInfo.currentOrigin)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Redirect URI</label>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {debugInfo.redirectUri}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(debugInfo.redirectUri)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client ID</label>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {debugInfo.clientId}
                  </code>
                  <Badge variant={debugInfo.clientId !== 'NOT SET' ? 'default' : 'destructive'}>
                    {debugInfo.clientId !== 'NOT SET' ? 'SET' : 'MISSING'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client Secret</label>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {debugInfo.clientSecretSet ? '***HIDDEN***' : 'NOT SET'}
                  </code>
                  <Badge variant={debugInfo.clientSecretSet ? 'default' : 'destructive'}>
                    {debugInfo.clientSecretSet ? 'SET' : 'MISSING'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Google Cloud Console Setup</h3>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>Required Redirect URI in Google Cloud Console:</strong>
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-2 rounded border text-sm flex-1 font-mono">
                    {debugInfo.redirectUri}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(debugInfo.redirectUri)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-blue-600">
                  Add this exact URI to your OAuth 2.0 Client ID in Google Cloud Console
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Troubleshooting Steps</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Copy the redirect URI above</li>
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Find your OAuth 2.0 Client ID</li>
                <li>Click Edit and add the redirect URI</li>
                <li>Save changes and wait 5-10 minutes for propagation</li>
                <li>Try the OAuth flow again</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Current Environment</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Timestamp: {debugInfo.timestamp}</div>
                <div>Current URL: {debugInfo.currentUrl}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailOAuthDebugger;