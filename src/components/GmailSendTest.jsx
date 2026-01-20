import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendInvoiceViaGmail } from '@/utils/gmailInvoiceService';

const GmailSendTest = () => {
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [results, setResults] = useState(null);

  const runGmailSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setTesting(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('=== GMAIL SEND TEST ===');
      
      // Create test invoice data
      const testInvoiceData = {
        invoice: {
          number: 'TEST-001',
          date: new Date().toISOString(),
          paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        },
        billTo: {
          name: 'Test Customer',
          email: testEmail,
          address: '123 Test Street',
          phone: '+1-555-0123'
        },
        items: [
          {
            name: 'Test Service',
            description: 'Gmail sending test',
            quantity: 1,
            amount: 100,
            total: 100
          }
        ],
        subTotal: 100,
        taxAmount: 10,
        grandTotal: 110,
        selectedCurrency: 'USD',
        notes: 'This is a test email sent via Gmail API to verify the connection is working properly.'
      };

      console.log('Sending test invoice via Gmail...');
      const startTime = Date.now();
      
      // Attempt to send via Gmail
      const result = await sendInvoiceViaGmail(testInvoiceData, user.id);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      const testResults = {
        success: result.success,
        method: result.method,
        error: result.error,
        sentTo: result.sentTo,
        sentFrom: result.sentFrom,
        duration: duration,
        timestamp: new Date().toISOString(),
        testEmail: testEmail,
        userId: user.id
      };

      console.log('Gmail Send Test Results:', testResults);
      setResults(testResults);

      if (result.success) {
        toast.success(`Test email sent successfully to ${testEmail}!`);
      } else {
        toast.error(`Gmail send failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Gmail send test failed:', error);
      toast.error(`Test failed: ${error.message}`);
      setResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        testEmail: testEmail
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
    if (status === true) return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
    if (status === false) return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-green-500" />
          Gmail Send Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email Address</Label>
          <Input
            id="testEmail"
            type="email"
            placeholder="Enter email to send test invoice"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={runGmailSendTest} disabled={testing || !testEmail}>
            {testing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send Test Email via Gmail
          </Button>
        </div>

        {results && (
          <div className="space-y-6">
            {/* Test Results Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                {getStatusIcon(results.success)}
                Test Results Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Send Status:</span>
                  {getStatusBadge(results.success)}
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <Badge variant="outline">{results.method || 'Unknown'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Test Email:</span>
                  <code className="bg-white px-1 rounded text-xs">{results.testEmail}</code>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{results.duration}ms</span>
                </div>
                {results.sentTo && (
                  <div className="flex justify-between">
                    <span>Sent To:</span>
                    <code className="bg-white px-1 rounded text-xs">{results.sentTo}</code>
                  </div>
                )}
                {results.sentFrom && (
                  <div className="flex justify-between">
                    <span>Sent From:</span>
                    <code className="bg-white px-1 rounded text-xs">{results.sentFrom}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Error Details */}
            {!results.success && results.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Error Details</h3>
                <div className="text-red-600 text-sm">
                  <code className="bg-white p-2 rounded block">{results.error}</code>
                </div>
              </div>
            )}

            {/* Success Message */}
            {results.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Success!</h3>
                <div className="text-green-600 text-sm space-y-1">
                  <div>✅ Gmail API call successful</div>
                  <div>✅ Test invoice email sent</div>
                  <div>✅ Check your inbox at {results.testEmail}</div>
                  <div className="mt-2 text-xs">
                    <strong>Note:</strong> If you don't see the email, check your spam folder. 
                    Gmail might flag test emails as spam.
                  </div>
                </div>
              </div>
            )}

            {/* Troubleshooting */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Troubleshooting</h3>
              <div className="text-blue-600 text-sm space-y-1">
                {results.success ? (
                  <>
                    <div>• Gmail sending is working correctly</div>
                    <div>• The issue with invoice emails might be elsewhere</div>
                    <div>• Check the invoice sending flow in the main app</div>
                  </>
                ) : (
                  <>
                    <div>• Gmail API call failed - this explains the fallback to EmailJS</div>
                    <div>• Check the error message above for specific details</div>
                    <div>• Common issues: expired tokens, API permissions, rate limits</div>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Test completed at: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailSendTest;