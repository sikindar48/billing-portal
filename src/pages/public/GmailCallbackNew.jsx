import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { handleGmailCallback } from '@/utils/gmailAuth';

/**
 * Gmail OAuth Callback Handler - Simplified and Robust
 */
const GmailCallbackNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Gmail connection...');
  const [details, setDetails] = useState('');

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      // Check for OAuth error
      const error = searchParams.get('error');
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      // Get authorization code and state
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        throw new Error('No authorization code received from Google');
      }

      setMessage('Verifying authentication...');
      
      // Handle the callback
      const result = await handleGmailCallback(code, state);

      // Success!
      setStatus('success');
      setMessage('Gmail connected successfully!');
      setDetails(`Your account ${result.email} is now connected. You can send invoices from your Gmail address.`);
      
      toast.success(`Gmail connected: ${result.email}`);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/branding');
      }, 2000);

    } catch (error) {
      console.error('Gmail callback error:', error);
      setStatus('error');
      setMessage('Failed to connect Gmail');
      setDetails(error.message);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
        
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'processing' && (
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          {status === 'processing' && 'Connecting Gmail...'}
          {status === 'success' && 'Gmail Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h1>

        {/* Message */}
        <p className="text-slate-300 mb-2">
          {message}
        </p>

        {/* Details */}
        {details && (
          <p className={`text-sm mb-6 ${
            status === 'success' ? 'text-emerald-400' : 
            status === 'error' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {details}
          </p>
        )}

        {/* Progress for processing */}
        {status === 'processing' && (
          <div className="mb-6">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {/* Success redirect message */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-300 text-sm">
              Redirecting to settings...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <Button
              onClick={() => navigate('/branding')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Go to Settings
            </Button>
          )}
          
          {status === 'error' && (
            <>
              <Button
                onClick={() => navigate('/branding')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                Try Again
              </Button>
              
              <Button
                onClick={() => navigate('/branding')}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Having trouble? Make sure you granted permission to send emails.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GmailCallbackNew;
