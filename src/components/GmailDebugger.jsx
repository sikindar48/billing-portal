import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

/**
 * Temporary debugging component to test Gmail Edge Function
 * Add this to your branding page to diagnose issues
 */
const GmailDebugger = () => {
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testEdgeFunction = async () => {
    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('gmail-token-exchange', {
        body: { 
          code: 'test_code_12345',
          redirect_uri: 'http://localhost:8080/gmail-callback'
        }
      });

      console.log('Test result:', { data, error });

      if (error) {
        setResult({
          type: 'error',
          title: 'Supabase Function Error',
          message: error.message,
          details: JSON.stringify(error, null, 2)
        });
      } else if (data?.error === 'server_config_error') {
        setResult({
          type: 'error',
          title: '❌ Configuration Error',
          message: 'Gmail credentials are not set in Supabase secrets.',
          details: 'Run these commands:\n\nsupabase secrets set GMAIL_CLIENT_ID="your_id"\nsupabase secrets set GMAIL_CLIENT_SECRET="your_secret"\n\nThen redeploy:\nsupabase functions deploy gmail-token-exchange'
        });
      } else if (data?.error === 'invalid_grant') {
        setResult({
          type: 'success',
          title: '✅ Edge Function Working!',
          message: 'The Edge Function is properly configured.',
          details: 'The "invalid_grant" error is expected because we used a fake test code. Your Gmail OAuth should work now!'
        });
      } else if (data?.error) {
        setResult({
          type: 'warning',
          title: 'OAuth Error',
          message: data.error_description || data.error,
          details: JSON.stringify(data, null, 2)
        });
      } else {
        setResult({
          type: 'success',
          title: '✅ Success',
          message: 'Unexpected success with test code',
          details: JSON.stringify(data, null, 2)
        });
      }
    } catch (err) {
      setResult({
        type: 'error',
        title: 'Exception',
        message: err.message,
        details: err.stack
      });
    } finally {
      setTesting(false);
    }
  };

  const getBackgroundColor = () => {
    if (!result) return 'bg-gray-50';
    switch (result.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        🔧 Gmail OAuth Debugger
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        Test if your Supabase Edge Function is properly configured
      </p>

      <Button
        onClick={testEdgeFunction}
        disabled={testing}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {testing ? 'Testing...' : 'Test Edge Function'}
      </Button>

      {result && (
        <div className={`mt-4 p-4 border rounded-lg ${getBackgroundColor()}`}>
          <h4 className="font-semibold mb-2">{result.title}</h4>
          <p className="text-sm mb-2">{result.message}</p>
          {result.details && (
            <pre className="text-xs bg-white/50 p-3 rounded overflow-auto max-h-64">
              {result.details}
            </pre>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-white/50 rounded text-xs text-gray-600">
        <strong>What this tests:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Edge Function is deployed and accessible</li>
          <li>Supabase secrets (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET) are set</li>
          <li>Function can communicate with Google OAuth</li>
        </ul>
      </div>
    </div>
  );
};

export default GmailDebugger;
