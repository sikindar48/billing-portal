import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const OAuthDebugger = () => {
  const checkConfiguration = () => {
    const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GMAIL_CLIENT_SECRET;
    const currentOrigin = window.location.origin;
    
    console.log('=== OAuth Configuration Debug ===');
    console.log('Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET');
    console.log('Client Secret:', clientSecret ? 'SET' : 'NOT SET');
    console.log('Current Origin:', currentOrigin);
    console.log('Recommended Redirect URI:', `${currentOrigin}/gmail-callback`);
    console.log('================================');
    
    if (!clientId) {
      toast.error('Gmail Client ID not configured in environment variables');
      return;
    }
    
    if (!clientSecret) {
      toast.error('Gmail Client Secret not configured in environment variables');
      return;
    }
    
    toast.success('OAuth configuration looks good! Check console for details.');
  };

  const testRedirectUri = () => {
    const currentOrigin = window.location.origin;
    const redirectUri = currentOrigin.includes('localhost') || currentOrigin.includes('192.168') || currentOrigin.includes('127.0.0.1')
      ? 'http://localhost:8081/gmail-callback'
      : `${currentOrigin}/gmail-callback`;
    
    console.log('=== Redirect URI Test ===');
    console.log('Current Origin:', currentOrigin);
    console.log('Calculated Redirect URI:', redirectUri);
    console.log('Is Local Development:', currentOrigin.includes('localhost') || currentOrigin.includes('192.168'));
    console.log('========================');
    
    toast.info(`Redirect URI: ${redirectUri}`);
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-3">OAuth Configuration Debugger</h3>
      <div className="space-y-2">
        <Button 
          onClick={checkConfiguration}
          variant="outline"
          size="sm"
          className="mr-2"
        >
          Check Config
        </Button>
        <Button 
          onClick={testRedirectUri}
          variant="outline"
          size="sm"
        >
          Test Redirect URI
        </Button>
      </div>
      <p className="text-xs text-yellow-700 mt-2">
        Use these buttons to debug OAuth configuration. Check browser console for details.
      </p>
    </div>
  );
};

export default OAuthDebugger;