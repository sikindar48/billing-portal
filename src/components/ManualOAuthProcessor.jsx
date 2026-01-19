import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  exchangeCodeForTokens, 
  getGmailProfile, 
  saveGmailTokens 
} from '@/utils/gmailOAuthServiceFixed';

const ManualOAuthProcessor = () => {
  const [authCode, setAuthCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Listen for OAuth code from DirectGmailConnect
    const handleOAuthCode = (event) => {
      setAuthCode(event.detail.code);
      toast.info('OAuth code received! Click "Process OAuth Code" to continue.');
    };

    window.addEventListener('gmail-oauth-code', handleOAuthCode);
    
    // Also check URL parameters on component mount
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !authCode) {
      setAuthCode(code);
    }

    return () => {
      window.removeEventListener('gmail-oauth-code', handleOAuthCode);
    };
  }, [authCode]);

  const processOAuthCode = async () => {
    try {
      setProcessing(true);
      setResult(null);

      if (!authCode) {
        throw new Error('Authorization code is required');
      }

      console.log('Processing OAuth code with fixed service:', authCode);

      // Step 1: Exchange code for tokens using fixed service
      console.log('Exchanging code for tokens...');
      const tokens = await exchangeCodeForTokens(authCode);
      console.log('Tokens received successfully');

      // Step 2: Get user profile using fixed service
      console.log('Getting Gmail profile...');
      let userEmail;
      
      try {
        const profile = await getGmailProfile(tokens.access_token);
        userEmail = profile.emailAddress;
        console.log('Gmail profile retrieved:', userEmail);
      } catch (profileError) {
        console.error('Profile error:', profileError);
        
        // Fallback: Ask user for their email
        const manualEmail = prompt(
          'We couldn\'t automatically detect your Gmail address.\n\n' +
          'Please enter your Gmail address manually:',
          'your-email@gmail.com'
        );
        
        if (!manualEmail || !manualEmail.includes('@')) {
          throw new Error('Valid Gmail address is required to continue');
        }
        
        userEmail = manualEmail.trim();
        console.log('Using manually entered email:', userEmail);
      }

      if (!userEmail) {
        throw new Error('No email address provided');
      }

      // Step 3: Save to database using fixed service
      console.log('Saving Gmail connection with fixed service...');
      await saveGmailTokens(tokens, userEmail);

      setResult({
        success: true,
        email: userEmail,
        message: 'Gmail connected successfully using fixed Supabase service!'
      });

      toast.success(`Gmail connected: ${userEmail}`);

    } catch (error) {
      console.error('OAuth processing error:', error);
      setResult({
        success: false,
        error: error.message
      });
      toast.error(`Failed to process OAuth: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const checkStoredData = () => {
    const stored = localStorage.getItem('gmail_oauth_data');
    if (stored) {
      const data = JSON.parse(stored);
      console.log('Stored Gmail data:', data);
      alert(`Stored Gmail data found for: ${data.email}\nConnected at: ${data.connected_at}`);
    } else {
      alert('No stored Gmail data found');
    }
  };

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-semibold text-green-800 mb-3">Manual OAuth Processor</h3>
      
      <div className="space-y-4">
        <div>
          <Label className="text-green-700">Authorization Code:</Label>
          <Input
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Paste authorization code here"
            className="mt-1"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={processOAuthCode}
            disabled={processing || !authCode}
            size="sm"
            className="bg-green-600 hover:bg-green-500"
          >
            {processing ? 'Processing...' : 'Process OAuth Code'}
          </Button>
          
          <Button 
            onClick={checkStoredData}
            variant="outline"
            size="sm"
          >
            Check Stored Data
          </Button>
        </div>
        
        {result && (
          <div className={`p-3 rounded-lg ${
            result.success 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-red-100 border border-red-300'
          }`}>
            {result.success ? (
              <div>
                <p className="text-green-800 font-semibold">✅ Success!</p>
                <p className="text-green-700">Email: {result.email}</p>
                <p className="text-green-600 text-sm">{result.message}</p>
              </div>
            ) : (
              <div>
                <p className="text-red-800 font-semibold">❌ Error</p>
                <p className="text-red-700 text-sm">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="text-xs text-green-700 mt-2">
        This bypasses the Supabase import issue and processes your OAuth code directly.
      </p>
    </div>
  );
};

export default ManualOAuthProcessor;