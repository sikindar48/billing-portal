import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ExternalLink, CheckCircle } from 'lucide-react';

const DirectGmailConnect = () => {
  const [connecting, setConnecting] = useState(false);

  const initiateGmailOAuth = () => {
    try {
      setConnecting(true);
      
      const clientId = '22562132278-g25nrkac9nnp7omg16glcpuui9v6r7t4.apps.googleusercontent.com';
      const redirectUri = 'http://localhost:8080/branding'; // Redirect back to settings instead of callback
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
      authUrl.searchParams.set('state', 'gmail_oauth'); // Add state to identify the return

      console.log('=== Direct Gmail OAuth ===');
      console.log('Redirect URI:', redirectUri);
      console.log('OAuth URL:', authUrl.toString());
      console.log('========================');

      toast.info('Redirecting to Google OAuth...');
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error initiating Gmail OAuth:', error);
      toast.error('Failed to start Gmail connection');
      setConnecting(false);
    }
  };

  const checkForOAuthReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'gmail_oauth') {
      // Auto-populate the Manual OAuth Processor
      setTimeout(() => {
        const event = new CustomEvent('gmail-oauth-code', { detail: { code } });
        window.dispatchEvent(event);
      }, 100);
      
      return {
        hasCode: true,
        code: code,
        message: 'OAuth code detected! Processing automatically...'
      };
    }
    
    return { hasCode: false };
  };

  const oauthReturn = checkForOAuthReturn();

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Direct Gmail Connection
      </h3>
      
      {oauthReturn.hasCode ? (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-800">OAuth Code Received!</span>
          </div>
          <p className="text-green-700 text-sm">{oauthReturn.message}</p>
          <p className="text-green-600 text-xs mt-1">Code: {oauthReturn.code.substring(0, 20)}...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-blue-700 text-sm">
            This bypasses the callback page and redirects back to settings directly.
          </p>
          
          <Button 
            onClick={initiateGmailOAuth}
            disabled={connecting}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {connecting ? 'Connecting...' : 'Connect Gmail (Direct)'}
          </Button>
        </div>
      )}
      
      <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
        <strong>How it works:</strong>
        <br />1. Redirects to Google OAuth
        <br />2. Returns to this page with code
        <br />3. Use Manual OAuth Processor to complete
      </div>
    </div>
  );
};

export default DirectGmailConnect;