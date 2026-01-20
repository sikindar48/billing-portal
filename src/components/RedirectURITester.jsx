import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ExternalLink, Copy } from 'lucide-react';

const RedirectURITester = () => {
  const [customRedirectUri, setCustomRedirectUri] = useState('http://localhost:8080/branding');

  const testRedirectUri = () => {
    const clientId = '22562132278-g25nrkac9nnp7omg16glcpuui9v6r7t4.apps.googleusercontent.com';
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', customRedirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', 'redirect_test');

    console.log('Testing redirect URI:', customRedirectUri);
    console.log('Full OAuth URL:', authUrl.toString());

    toast.info(`Testing redirect URI: ${customRedirectUri}`);
    window.location.href = authUrl.toString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const commonRedirectUris = [
    'http://localhost:8080/branding',
    'http://localhost:8080/gmail-callback',
    'http://localhost:5173/branding',
    'http://localhost:5173/gmail-callback',
    'https://invoiceport.live/branding',
    'https://invoiceport.live/gmail-callback'
  ];

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-3">Redirect URI Tester</h3>
      
      <div className="space-y-4">
        <div>
          <Label className="text-yellow-700">Custom Redirect URI:</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={customRedirectUri}
              onChange={(e) => setCustomRedirectUri(e.target.value)}
              placeholder="http://localhost:8080/branding"
              className="flex-1"
            />
            <Button 
              onClick={() => testRedirectUri()}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-500"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Test
            </Button>
          </div>
        </div>
        
        <div>
          <Label className="text-yellow-700 mb-2 block">Common Redirect URIs (click to copy):</Label>
          <div className="space-y-1">
            {commonRedirectUris.map((uri, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-yellow-100 rounded cursor-pointer hover:bg-yellow-200"
                onClick={() => copyToClipboard(uri)}
              >
                <span className="text-sm text-yellow-800 font-mono">{uri}</span>
                <Copy className="w-3 h-3 text-yellow-600" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-3 bg-yellow-100 rounded text-xs text-yellow-700">
          <strong>Instructions:</strong>
          <br />1. Copy the redirect URIs above
          <br />2. Add them to Google Cloud Console
          <br />3. Test with the custom URI field
          <br />4. If successful, OAuth will redirect back here
        </div>
      </div>
    </div>
  );
};

export default RedirectURITester;