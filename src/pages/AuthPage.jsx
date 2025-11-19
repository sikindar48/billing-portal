import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ArrowRight, LayoutDashboard, CheckCircle2 } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // State to prevent flickering while checking initial session
  const [verifyingSession, setVerifyingSession] = useState(true);

  // 1. Check if user is already logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is authenticated, redirect immediately to Index
          navigate('/', { replace: true }); 
        } else {
          // No session found, stop loading and show the login form
          setVerifyingSession(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setVerifyingSession(false);
      }
    };
    
    checkUser();
  }, [navigate]);

  // 2. Handle Login and Signup
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Welcome back! Logged in successfully.');
        // Direct redirect to Index
        navigate('/', { replace: true });
      } else {
        // --- SIGNUP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast.success('Account created successfully! Please check your email.');
        // Direct redirect to Index
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // 3. Loading state view
  if (verifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 4. Main UI Render
  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* Left Side - Visual & Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-800 opacity-90" />
        <div 
            className="absolute inset-0" 
            style={{ 
                backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80")', 
                backgroundSize: 'cover', 
                mixBlendMode: 'overlay', 
                opacity: 0.2 
            }}
        ></div>
        
        <div className="relative z-10 p-12 text-white max-w-xl">
            <div className="mb-8 flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                    <LayoutDashboard className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">InvoicePort</h1>
            </div>
            <h2 className="text-4xl font-extrabold mb-6 leading-tight">
                Manage your business finances with confidence.
            </h2>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                Create professional invoices, track payments, and manage your clients all in one place. Join thousands of businesses trusting InvoicePort.
            </p>
            <div className="space-y-4">
                {[
                    'Unlimited Invoice Generation',
                    'Customizable Templates',
                    'Client Management',
                    'Secure Data Storage'
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-indigo-50">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Abstract Circles for depth */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-gray-500 mt-2">
                    {isLogin ? 'Enter your details to access your account.' : 'Start your journey with us today.'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                        {isLogin && (
                            <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                Forgot password?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Lock className="h-5 w-5" />
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 rounded-lg" 
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            {isLogin ? 'Sign In' : 'Create Account'} 
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">
                        {isLogin ? "New to InvoicePort?" : "Already have an account?"}
                    </span>
                </div>
            </div>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline transition-all text-base"
                >
                    {isLogin ? "Create a new account" : "Sign in to your account"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;