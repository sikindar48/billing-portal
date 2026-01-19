import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendOTP, verifyOTP, canRequestNewOTP } from '@/utils/otpService';
import OTPInput from '@/components/OTPInput';
import { Loader2, Mail, CheckCircle2, RefreshCw } from 'lucide-react';

const OTPTester = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [step, setStep] = useState('send'); // 'send' or 'verify'

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    // Check rate limiting
    const rateCheck = await canRequestNewOTP(email, 'password_reset');
    if (!rateCheck.canRequest) {
      toast.error(`Please wait ${rateCheck.waitTime} seconds before requesting a new OTP`);
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(email, 'password_reset');
      
      if (result.success) {
        toast.success('OTP sent successfully!');
        setStep('verify');
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyLoading(true);
    try {
      const result = await verifyOTP(email, otpCode, 'password_reset');
      
      if (result.success) {
        toast.success('OTP verified successfully!');
        setStep('send');
        setOtpCode('');
        setEmail('');
      } else {
        toast.error(result.error || 'Invalid OTP');
        setOtpCode('');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Failed to verify OTP');
      setOtpCode('');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleReset = () => {
    setStep('send');
    setOtpCode('');
    setEmail('');
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="text-gray-900 font-semibold mb-3">OTP System Test</h4>
      
      {step === 'send' ? (
        <form onSubmit={handleSendOTP} className="space-y-3">
          <div>
            <Label htmlFor="test-email" className="text-sm font-medium text-gray-700">
              Test Email Address
            </Label>
            <Input
              id="test-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to test OTP"
              className="mt-1"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test OTP
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              OTP sent to: <span className="font-medium text-blue-600">{email}</span>
            </p>
            
            <Label className="text-sm font-medium text-gray-700 block mb-2">
              Enter 6-digit OTP
            </Label>
            <OTPInput
              length={6}
              onComplete={setOtpCode}
              onValueChange={setOtpCode}
              disabled={verifyLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleVerifyOTP}
              disabled={verifyLoading || otpCode.length !== 6}
              className="flex-1"
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify OTP
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={verifyLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        This tests the OTP generation, email sending, and verification process.
      </p>
    </div>
  );
};

export default OTPTester;