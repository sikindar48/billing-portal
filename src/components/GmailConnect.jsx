import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Loader2,
  ExternalLink,
  Unlink,
  AlertCircle
} from 'lucide-react';
import {
  startGmailAuth,
  checkGmailConnection,
  disconnectGmail,
  sendGmailEmail
} from '@/utils/gmailAuth';

/**
 * Gmail Connection Component - Simplified and Robust
 */
const GmailConnect = () => {
  const [status, setStatus] = useState({ 
    connected: false, 
    checking: true,
    email: null,
    error: null
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const result = await checkGmailConnection();
      setStatus({ 
        connected: result.connected,
        email: result.email,
        error: result.error,
        checking: false
      });
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      setStatus({ 
        connected: false, 
        checking: false,
        error: error.message
      });
    }
  };

  const handleConnect = () => {
    try {
      startGmailAuth();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return;

    try {
      await disconnectGmail();
      toast.success('Gmail disconnected');
      setStatus({ connected: false, checking: false, email: null });
    } catch (error) {
      toast.error('Failed to disconnect: ' + error.message);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    
    try {
      await sendGmailEmail({
        to: status.email,
        from: status.email,
        replyTo: status.email,
        subject: 'Gmail Integration Test - InvoicePort',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">✅ Gmail Integration Working!</h2>
            <p>Your Gmail integration is configured correctly.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #334155; margin-top: 0;">Test Details:</h3>
              <ul style="color: #64748b;">
                <li><strong>Sent from:</strong> ${status.email}</li>
                <li><strong>Method:</strong> Gmail API via OAuth 2.0</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Platform:</strong> InvoicePort</li>
              </ul>
            </div>
            <p style="color: #64748b;">
              This email was sent using your Gmail account through InvoicePort's secure integration.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 14px;">Sent via InvoicePort Gmail Integration</p>
          </div>
        `
      });
      
      toast.success(`Test email sent to ${status.email}! Check your inbox.`);
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Failed to send test email: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  if (status.checking) {
    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span className="text-gray-600">Checking Gmail connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`p-4 rounded-lg border ${
        status.connected 
          ? 'bg-emerald-50 border-emerald-200' 
          : status.error
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {status.connected ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : status.error ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="font-semibold text-gray-800">
            Gmail Integration
          </h3>
        </div>
        
        {status.connected ? (
          <div className="space-y-1">
            <p className="text-emerald-700 text-sm">
              ✅ Connected: <strong>{status.email}</strong>
            </p>
            <p className="text-xs text-emerald-600">
              Invoices will be sent from your Gmail account
            </p>
          </div>
        ) : status.error ? (
          <div className="space-y-1">
            <p className="text-red-700 text-sm font-medium">Connection Error</p>
            <p className="text-xs text-red-600">{status.error}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-gray-600 text-sm">Not connected</p>
            <p className="text-xs text-gray-500">
              Connect your Gmail to send professional emails from your own address
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {!status.connected ? (
          <Button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect Gmail
          </Button>
        ) : (
          <>
            <Button
              onClick={handleTest}
              disabled={testing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </>
        )}
        
        <Button
          onClick={checkStatus}
          variant="outline"
          className="border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Instructions */}
      {!status.connected && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-blue-700 font-semibold mb-2 text-sm">
            How to connect Gmail:
          </h4>
          <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
            <li>Click "Connect Gmail" above</li>
            <li>Sign in to your Google account</li>
            <li>Grant permission to send emails</li>
            <li>You'll be redirected back automatically</li>
            <li>Test the connection with a sample email</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default GmailConnect;
