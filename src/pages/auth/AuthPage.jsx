import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sendOTP } from '@/utils/otpService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import Navbar from '@/components/Navbar';
import PublicFooter from '@/components/PublicFooter';
import { 
  Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2 
} from 'lucide-react';

// --- 3D TILT COMPONENT ---
const TiltCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5; 
    const rotateY = ((x - centerX) / centerX) * 5;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out transform-gpu ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      }}
    >
      {children}
    </div>
  );
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpCooldownRef = useRef(null);

  // --- AUTH LOGIC ---
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard', { replace: true }); 
        } else {
          setVerifyingSession(false);
        }
      } catch (error) {
        setVerifyingSession(false);
      }
    };
    checkUser();
    return () => {
      if (otpCooldownRef.current) clearInterval(otpCooldownRef.current);
    };
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          throw error;
        }
        toast.success('Welcome back!', { duration: 1500 });
        navigate('/dashboard', { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please log in instead.');
          }
          throw error;
        }

        if (data?.user && data.user.identities?.length === 0) {
          throw new Error('This email is already registered. Please log in instead.');
        }

        if (data?.session?.access_token) {
          void supabase.functions.invoke('send-email', {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
            body: {
              type: 'welcome',
              to: email,
              user_name: name || email,
            },
          }).catch(() => {});
        }

        toast.success('Account created! Welcome to InvoicePort 🎉', { duration: 3000 });
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message || "Authentication failed. Please try again.", { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.", { duration: 2000 });
      return;
    }
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown}s before requesting another OTP.`, { duration: 2000 });
      return;
    }
    setLoading(true);
    try {
      const result = await sendOTP(email, 'password_reset');
      if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
      }
      toast.success("OTP sent to your email!", { duration: 2500 });
      setOtpCooldown(60);
      otpCooldownRef.current = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) { clearInterval(otpCooldownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      navigate(`/otp-verification?email=${encodeURIComponent(email)}&purpose=password_reset`);
    } catch (error) {
      toast.error(error.message || "Failed to send OTP", { duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Sign In - Access Your Account | Invoice Port"
        description="Sign in to your Invoice Port account to manage clients, templates, and billing details."
        noIndex={true}
        noFollow={true}
      />
      <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col justify-between">
        
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent blur-3xl"></div>
        </div>

        {/* Navbar */}
        <Navbar />

        {/* Hero Section / Login Form */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 py-16 lg:py-24 gap-16 lg:gap-24 flex-1 w-full">
          
          {/* Left: Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Automated Financial Suite v2.0
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
              Welcome to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                InvoicePort.
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Create professional invoices, automate client billing, and track your revenue growth instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> No credit card required
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> 3-day free trial
              </div>
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="w-full lg:w-1/2 max-w-md relative">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px]"></div>

            <TiltCard>
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl ring-1 ring-white/5">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white">{isLogin ? 'Sign In' : 'Get Started'}</h2>
                  <p className="text-slate-400 text-sm mt-2">{isLogin ? 'Access your dashboard' : 'Start your 3-day free trial.'}</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-5">
                  
                  {/* Name Input (Signup Only) */}
                  {!isLogin && (
                    <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="John Doe" 
                          className="pl-10 h-11 bg-slate-950/50 border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl" 
                          required={!isLogin} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <Input 
                        id="email"
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="you@example.com" 
                        className="pl-10 h-11 bg-slate-950/50 border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</Label>
                      {isLogin && (
                        <button 
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={otpCooldown > 0 || loading}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Forgot password?'}
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <Input 
                        id="password"
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="pl-10 pr-10 h-11 bg-slate-950/50 border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl" 
                        required 
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

                  <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-2">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isLogin ? 'Access Account' : 'Start Free Trial')}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {isLogin ? "New here? Create an account" : "Already have an account? Sign In"}
                  </button>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
};

export default AuthPage;