import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { verifyOTP, sendOTP, canRequestNewOTP } from '@/utils/otpService';
import OTPInput from '@/components/OTPInput';
import SEO from '@/components/SEO';
import { 
  Loader2, Mail, ArrowLeft, CheckCircle2, Clock, 
  RefreshCw, Shield, Eye, EyeOff 
} from 'lucide-react';

const OTPVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get email and purpose from URL params
  const email = searchParams.get('email');
  const purpose = searchParams.get('purpose') || 'password_reset';
  
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState('verify'); // 'verify' or 'reset'
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast.error('Invalid verification link');
      navigate('/', { replace: true });
    }
  }, [email, navigate]);

  // Timer for resend cooldown
  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setCanResend(true);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleOTPComplete = async (code) => {
    setOtpCode(code);
    await handleVerifyOTP(code);
  };

  const handleVerifyOTP = async (code = otpCode) => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(email, code, purpose);
      
      if (result.success) {
        toast.success('OTP verified successfully!');
        
        if (purpose === 'password_reset') {
          setStep('reset');
        } else {
          // For other purposes, redirect to appropriate page
          navigate('/dashboard', { replace: true });
        }
      } else {
        toast.error(result.error || 'Invalid OTP code');
        setOtpCode('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Verification failed. Please try again.');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // Check rate limiting
    const rateCheck = await canRequestNewOTP(email, purpose);
    if (!rateCheck.canRequest) {
      setTimeLeft(rateCheck.waitTime);
      setCanResend(false);
      toast.error(`Please wait ${rateCheck.waitTime} seconds before requesting a new OTP`);
      return;
    }

    setResendLoading(true);
    try {
      const result = await sendOTP(email, purpose);
      
      if (result.success) {
        toast.success('New OTP sent to your email!');
        setOtpCode('');
        setTimeLeft(60); // 1 minute cooldown
        setCanResend(false);
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!');
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <SEO 
        title="Verify OTP"
        description="Verify your OTP code to continue."
        noIndex={true}
        noFollow={true}
      />
      <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30">
        
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>

            {/* Main Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl ring-1 ring-white/5">
              
              {step === 'verify' ? (
                <>
                  {/* OTP Verification Step */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Verify OTP</h1>
                    <p className="text-slate-400 text-sm">
                      We've sent a 6-digit code to
                    </p>
                    <p className="text-indigo-400 font-medium">{email}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center">
                      <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 block">
                        Enter OTP Code
                      </Label>
                      <OTPInput
                        length={6}
                        onComplete={handleOTPComplete}
                        onValueChange={setOtpCode}
                        disabled={loading}
                        error={false}
                      />
                    </div>

                    <Button 
                      onClick={() => handleVerifyOTP()}
                      disabled={loading || otpCode.length !== 6}
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Verify OTP
                        </>
                      )}
                    </Button>

                    {/* Resend Section */}
                    <div className="text-center space-y-3">
                      <p className="text-slate-400 text-sm">Didn't receive the code?</p>
                      
                      {canResend ? (
                        <Button
                          variant="ghost"
                          onClick={handleResendOTP}
                          disabled={resendLoading}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50"
                        >
                          {resendLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resend OTP
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                          <Clock className="w-4 h-4" />
                          Resend in {formatTime(timeLeft)}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Password Reset Step */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-slate-400 text-sm">
                      Enter your new password below
                    </p>
                  </div>

                  <form onSubmit={handlePasswordReset} className="space-y-5">
                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        New Password
                      </Label>
                      <div className="relative group">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="pr-10 h-11 bg-slate-950/50 border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                          required
                          minLength={6}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Confirm Password
                      </Label>
                      <div className="relative group">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="pr-10 h-11 bg-slate-950/50 border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                          required
                          minLength={6}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      disabled={loading || !newPassword || !confirmPassword}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OTPVerification;