import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendWelcomeEmail } from '@/utils/emailService';
import { 
  Loader2, Mail, Lock, ArrowRight, LayoutDashboard, CheckCircle2, 
  Zap, ShieldCheck, Smartphone, Globe, BarChart3, FileText, Box, 
  Star, Check, Layers, Repeat, CreditCard, User, Eye, EyeOff
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
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPassword, setShowPassword] = useState(false);

  // --- AUTH LOGIC ---
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/', { replace: true }); 
        } else {
          setVerifyingSession(false);
        }
      } catch (error) {
        setVerifyingSession(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!', { duration: 1500 });
        navigate('/', { replace: true });
      } else {
        // Use Supabase default email confirmation (reliable)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: `https://invoiceport.live/`,
            data: { full_name: name }
          },
        });
        if (error) throw error;

        // Show success message - user needs to confirm email
        toast.success('Account created! Please check your email to confirm your account.', { duration: 4000 });
        
        // Don't navigate yet - user needs to confirm email first
        // Welcome email will be sent via EmailJS after email confirmation
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed", { duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
        toast.error("Please enter your email address first.", { duration: 2000 });
        return;
    }
    setLoading(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `https://invoiceport.live/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email!", { duration: 2500 });
    } catch (error) {
        toast.error(error.message || "Failed to send reset link", { duration: 2500 });
    } finally {
        setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusSignup = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsLogin(false);
      setTimeout(() => document.getElementById('email')?.focus(), 500);
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent blur-3xl"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center backdrop-blur-sm">
          <div className="flex items-center gap-2">
              <img 
                src="https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp" 
                alt="InvoicePort Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold tracking-tight">InvoicePort</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
              <Button 
                  variant="ghost" 
                  onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setIsLogin(!isLogin); }}
                  className="text-white hover:bg-white/10"
              >
                  {isLogin ? 'Create Account' : 'Log In'}
              </Button>
          </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 py-16 lg:py-24 gap-16 lg:gap-24 min-h-[80vh]">
          {/* Left: Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Automated Financial Suite v2.0
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                  Billing made <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                      Effortless.
                  </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Stop wrestling with spreadsheets. Generate professional invoices, track payments, and manage clients in seconds.
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
              {/* Glow Effects */}
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
                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hover:underline"
                                      >
                                          Forgot password?
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

      {/* --- FEATURES SECTION (Unchanged) --- */}
      <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-24">
                  <h2 className="text-indigo-400 font-semibold tracking-widest uppercase text-sm mb-3">System Capabilities</h2>
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Engineered for speed.</h3>
                  <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                      We stripped away the complexity. What's left is the fastest, most secure way to bill your clients.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <FeatureCard icon={<Zap className="w-6 h-6" />} title="Instant Generation" desc="Create high-fidelity PDF invoices in milliseconds. Our optimized rendering engine ensures no lag." color="indigo" />
                  <FeatureCard icon={<ShieldCheck className="w-6 h-6" />} title="Bank-Grade Security" desc="AES-256 encryption for all financial data. Your client information is isolated and secure." color="emerald" />
                  <FeatureCard icon={<BarChart3 className="w-6 h-6" />} title="Live Analytics" desc="Visualize revenue, track outstanding payments, and monitor growth with real-time dashboards." color="blue" />
                  <FeatureCard icon={<Globe className="w-6 h-6" />} title="Multi-Currency" desc="Support for USD, EUR, INR, and 150+ other currencies. Exchange rates handled automatically." color="purple" />
                  <FeatureCard icon={<Repeat className="w-6 h-6" />} title="Recurring Billing" desc="Set it and forget it. Automatically generate and send invoices for your retainer clients." color="orange" />
                  <FeatureCard icon={<FileText className="w-6 h-6" />} title="Custom Templates" desc="Professional templates that match your brand. Upload logos, change colors, and adjust layouts." color="pink" />
              </div>
          </div>
      </section>


      {/* --- REDESIGNED PRICING SECTION --- */}
      <section id="pricing" className="py-32 relative bg-gradient-to-b from-[#0B0F19] to-black">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <h2 className="text-indigo-400 font-semibold tracking-widest uppercase text-sm mb-3">Pricing</h2>
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-8">Simple, transparent pricing.</h3>
                  
                  {/* Toggle */}
                  <div className="inline-flex items-center p-1 bg-slate-900/50 border border-white/10 rounded-full backdrop-blur-md relative">
                       <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                       >
                           Monthly
                       </button>
                       <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative z-10 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                       >
                           Yearly
                       </button>
                       <div className={`absolute top-1 bottom-1 w-[50%] bg-indigo-600 rounded-full transition-transform duration-300 shadow-lg shadow-indigo-500/25 ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full left-[-4px]'}`}></div>
                  </div>
                  {billingCycle === 'yearly' && (
                        <span className="block mt-4 text-xs font-bold text-emerald-400 animate-pulse">
                            Save ~16% on yearly plans
                        </span>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  
                  {/* FREE TIER */}
                  <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col hover:border-white/10 transition-all">
                      <div className="mb-6">
                          <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">Starter</span>
                          <div className="mt-2 flex items-baseline">
                              <span className="text-4xl font-bold text-white">₹0</span>
                              <span className="text-slate-500 ml-2">/forever</span>
                          </div>
                          <p className="text-slate-400 text-sm mt-4">Perfect for freelancers just starting out.</p>
                      </div>
                      <ul className="space-y-4 mb-8 flex-1">
                          {['10 Invoices Limit', '3 Days Full Access', '5 Downloads Limit', 'Basic Templates'].map(f => (
                              <li key={f} className="flex gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-blue-500 shrink-0" /> {f}</li>
                          ))}
                      </ul>
                      <Button onClick={focusSignup} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10">Start Free</Button>
                  </div>

                  {/* PRO TIER */}
                  <div className="p-8 rounded-3xl border border-indigo-500/50 bg-slate-800/60 shadow-2xl shadow-indigo-500/10 relative flex flex-col scale-105 z-10">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/50">Popular</div>
                      <div className="mb-6">
                          <span className="text-indigo-400 font-bold text-sm uppercase tracking-wider">Pro</span>
                          <div className="mt-2 flex items-baseline">
                              <span className="text-5xl font-bold text-white">₹{billingCycle === 'monthly' ? '149' : '1499'}</span>
                              <span className="text-slate-400 ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                          </div>
                          <p className="text-indigo-100/80 text-sm mt-4">For growing businesses that need power.</p>
                      </div>
                      <ul className="space-y-4 mb-8 flex-1">
                          {['Unlimited Invoices', 'Unlimited Downloads', 'Email Integration', 'Priority Support', 'Custom Branding'].map(f => (
                              <li key={f} className="flex gap-3 text-sm text-white"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> {f}</li>
                          ))}
                      </ul>
                      <Button onClick={focusSignup} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25">Get Started</Button>
                  </div>

                  {/* ENTERPRISE */}
                  <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col hover:border-white/10 transition-all">
                      <div className="mb-6">
                          <span className="text-white font-bold text-sm uppercase tracking-wider">Enterprise</span>
                          <div className="mt-2 flex items-baseline">
                              <span className="text-4xl font-bold text-white">Custom</span>
                          </div>
                          <p className="text-slate-400 text-sm mt-4">For large teams and agencies.</p>
                      </div>
                      <ul className="space-y-4 mb-8 flex-1">
                          {['Dedicated Manager', 'SLA Support', 'Custom Templates', 'API Access'].map(f => (
                              <li key={f} className="flex gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-white shrink-0" /> {f}</li>
                          ))}
                      </ul>
                      <Button onClick={() => window.location.href = "mailto:sales@invoiceport.com"} className="w-full bg-white text-black hover:bg-slate-200 font-semibold">Contact Sales</Button>
                  </div>

              </div>
          </div>
      </section>


      {/* --- FOOTER (Unchanged) --- */}
      <footer className="py-12 border-t border-white/5 bg-[#05080F]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-white">
                  <img 
                    src="https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp" 
                    alt="InvoicePort Logo" 
                    className="h-5 w-auto"
                  />
                  <span className="text-lg font-bold tracking-tight">InvoicePort</span>
              </div>
              <div className="text-sm text-slate-600">
                  © {new Date().getFullYear()} InvoicePort Inc.
              </div>
          </div>
      </footer>
    </div>
  );
};

// Helper for Feature Cards (Unchanged)
const FeatureCard = ({ icon, title, desc, color }) => {
    const colorMap = {
        indigo: "text-indigo-400 bg-indigo-500/10",
        emerald: "text-emerald-400 bg-emerald-500/10",
        blue: "text-blue-400 bg-blue-500/10",
        purple: "text-purple-400 bg-purple-500/10",
        orange: "text-orange-400 bg-orange-500/10",
        pink: "text-pink-400 bg-pink-500/10"
    };

    return (
        <div className="group p-6 rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/50 hover:border-white/10 transition-all duration-300">
            <div className={`mb-4 inline-flex items-center justify-center p-3 rounded-xl ${colorMap[color]} transition-transform duration-300 group-hover:scale-110`}>
                {icon}
            </div>
            <h4 className="text-lg font-bold text-white mb-3">{title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
};

export default AuthPage;