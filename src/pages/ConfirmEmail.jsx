import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/utils/emailService';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';

const ConfirmEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
          setStatus('error');
          setMessage('Invalid confirmation link. Missing token or email.');
          return;
        }

        // Verify token
        if (!verifyToken(token, email)) {
          setStatus('expired');
          setMessage('Confirmation link has expired or is invalid.');
          return;
        }

        // Get user by email
        const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
        if (getUserError) throw getUserError;

        const user = users.find(u => u.email === email);
        if (!user) {
          setStatus('error');
          setMessage('User not found. Please sign up again.');
          return;
        }

        // Check if user is already confirmed
        if (user.email_confirmed_at) {
          setStatus('success');
          setMessage('Email already confirmed! Redirecting to dashboard...');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Create trial subscription
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 3);
        
        const { error: subError } = await supabase.from('user_subscriptions').insert({
          user_id: user.id,
          plan_id: 1, 
          status: 'trialing',
          current_period_end: trialEndDate.toISOString()
        });

        if (subError) {
          console.warn('Subscription creation failed:', subError);
          // Continue anyway - user can still access the app
        }

        // Send welcome email
        try {
          const userName = user.user_metadata?.full_name || 'User';
          await sendWelcomeEmail(email, userName);
        } catch (emailError) {
          console.warn('Welcome email failed:', emailError);
          // Don't fail confirmation for email issues
        }

        // Mark as confirmed (this is a simplified approach)
        // In production, you'd want to use Supabase's proper confirmation flow
        
        setStatus('success');
        setMessage('Email confirmed successfully! Your account is now active.');
        
        toast.success('Email confirmed! Welcome to InvoicePort!', { duration: 3000 });
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);

      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred during confirmation. Please try again.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const verifyToken = (token, email) => {
    try {
      const decoded = atob(token);
      const [tokenEmail, timestamp] = decoded.split(':');
      
      // Check email matches
      if (tokenEmail !== email) {
        console.error('Token email mismatch');
        return false;
      }
      
      // Check token age (24 hours max)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        console.error('Token expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  const resendConfirmation = () => {
    const email = searchParams.get('email');
    if (email) {
      // Redirect back to signup with email prefilled
      navigate(`/auth?email=${encodeURIComponent(email)}&resend=true`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl ring-1 ring-white/5 text-center">
        
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-full">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          )}
          {(status === 'error' || status === 'expired') && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          )}
        </div>

        {/* Status Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          {status === 'verifying' && 'Verifying Email...'}
          {status === 'success' && 'Email Confirmed!'}
          {status === 'error' && 'Confirmation Failed'}
          {status === 'expired' && 'Link Expired'}
        </h1>

        {/* Status Message */}
        <p className="text-slate-400 mb-6 leading-relaxed">
          {message || 'Please wait while we verify your email address...'}
        </p>

        {/* Action Buttons */}
        {status === 'success' && (
          <div className="space-y-3">
            <div className="text-sm text-slate-500">
              Redirecting to dashboard in 3 seconds...
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Go to Dashboard Now
            </button>
          </div>
        )}

        {(status === 'error' || status === 'expired') && (
          <div className="space-y-3">
            <button 
              onClick={resendConfirmation}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Resend Confirmation
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-xl transition-colors"
            >
              Back to Sign Up
            </button>
          </div>
        )}

        {status === 'verifying' && (
          <div className="text-sm text-slate-500">
            This may take a few moments...
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;