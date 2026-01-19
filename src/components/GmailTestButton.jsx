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
  Unlink
} from 'lucide-react';
import { 
  initiateGmailOAuth, 
  checkGmailConnection, 
  disconnectGmail,
  sendViaGmail,
  getValidAccessToken
} from '@/utils/gmailOAuthService';

const GmailTestButton = () => {
  const [gmailStatus, setGmailStatus] = useState({ 
    connected: false, 
    checking: true,
    email: null 
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      setGmailStatus(prev => ({ ...prev, checking: true }));
      const status = await checkGmailConnection();
      setGmailStatus({ 
        ...status, 
        checking: false 
      });
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      setGmailStatus({ 
        connected: false, 
        checking: false, 
        error: error.message 
      });
    }
  };

  const handleGmailConnect = () => {
    try {
      toast.info('Redirecting to Google OAuth...');
      initiateGmailOAuth();
    } catch (error) {
      console.error('Error initiating Gmail OAuth:', error);
      toast.error('Failed to start Gmail connection');
    }
  };

  const handleGmailDisconnect = async () => {
    try {
      const result = await disconnectGmail();
      if (result.success) {
        toast.success('Gmail disconnected successfully');
        setGmailStatus({ connected: false, checking: false });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    }
  };

  const handleTestEmail = async () => {
    try {
      setTesting(true);
      
      // Get valid access token
      const accessToken = await getValidAccessToken();
      
      // Test email data
      const testEmailData = {
        to: gmailStatus.email, // Send to self for testing
        from: gmailStatus.email,
        replyTo: gmailStatus.email,
        subject: 'Gmail Integration Test - InvoicePort',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">🎉 Gmail Integration Success!</h2>
            <p>Congratulations! Your Gmail integration is working perfectly.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #334155; margin-top: 0;">Test Details:</h3>
              <ul style="color: #64748b;">
                <li><strong>Sent from:</strong> ${gmailStatus.email}</li>
                <li><strong>Method:</strong> Gmail API via OAuth</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Platform:</strong> InvoicePort</li>
              </ul>
            </div>
            <p style="color: #64748b;">
              This email was sent using your own Gmail account through InvoicePort's Gmail integration.
              Your invoices will now be sent from your professional email address!
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 14px;">
              Sent via InvoicePort Gmail Integration
            </p>
          </div>
        `
      };

      // Send test email
      const result = await sendViaGmail(testEmailData, accessToken);
      
      if (result.success) {
        toast.success(`Test email sent successfully! Check your inbox: ${gmailStatus.email}`);
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (gmailStatus.checking) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        <span className="text-slate-300">Checking Gmail connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${
        gmailStatus.connected 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-slate-800/50 border-slate-700'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {gmailStatus.connected ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-slate-400" />
          )}
          <h3 className="font-semibold text-white">
            Gmail Integration Status
          </h3>
        </div>
        
        {gmailStatus.connected ? (
          <div className="space-y-2">
            <p className="text-emerald-300">
              ✅ Connected to: <strong>{gmailStatus.email}</strong>
            </p>
            <p className="text-sm text-emerald-400">
              Your invoices will be sent from your Gmail account
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-300">
              Gmail not connected
            </p>
            <p className="text-sm text-slate-400">
              Connect your Gmail to send professional emails from your own address
            </p>
            {gmailStatus.error && (
              <p className="text-sm text-red-400">
                Error: {gmailStatus.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {!gmailStatus.connected ? (
          <Button
            onClick={handleGmailConnect}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect Gmail Account
          </Button>
        ) : (
          <>
            <Button
              onClick={handleTestEmail}
              disabled={testing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
            
            <Button
              onClick={handleGmailDisconnect}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </>
        )}
        
        <Button
          onClick={checkGmailStatus}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Instructions */}
      {!gmailStatus.connected && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-semibold mb-2">How to Connect Gmail:</h4>
          <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
            <li>Click "Connect Gmail Account" above</li>
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

export default GmailTestButton;