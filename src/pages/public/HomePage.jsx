import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PublicFooter from '@/components/PublicFooter';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowRight, CheckCircle2, FileText, Zap, ShieldCheck, 
  Plus, Trash2, DollarSign, Check, HelpCircle, Sparkles, TrendingUp,
  Calendar, Server, Clock
} from 'lucide-react';

const AnimatedCounter = ({ from = 0, to, duration = 1.5, decimals = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (inView) {
      const controls = animate(from, to, {
        duration: duration,
        ease: "easeOut",
        onUpdate: (value) => {
          setCount(value);
        }
      });
      return () => controls.stop();
    }
  }, [inView, from, to, duration]);

  const formattedCount = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.round(count).toLocaleString('en-IN');

  return <span ref={ref}>{formattedCount}</span>;
};



const SpotlightCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-8 transition-all duration-300 hover:border-white/10 group spotlight-card ${className}`}
    >
      <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-[radial-gradient(350px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.08),transparent_80%)]" />
      <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 border border-indigo-500/10 rounded-3xl bg-[radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.15),transparent_60%)]Mask" style={{ WebkitMaskImage: 'radial-gradient(circle, black, transparent)' }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/5 bg-slate-900/30 rounded-2xl overflow-hidden transition-all hover:border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left font-semibold text-white focus:outline-none"
      >
        <span className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-2 text-slate-400 text-sm leading-relaxed border-t border-white/5">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  
  // Pricing toggle state
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  // Sandbox Invoice Builder State
  const [clientName, setClientName] = useState('Acme Corporation');
  const [gstRate, setGstRate] = useState(18);
  const [itemName, setItemName] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { id: 1, desc: 'Software Consulting', qty: 1, rate: 45000 },
    { id: 2, desc: 'UI Design Services', qty: 1, rate: 25000 }
  ]);

  // Automatically redirect logged-in users
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName || !itemRate) return;
    const newItem = {
      id: Date.now(),
      desc: itemName,
      qty: 1,
      rate: parseFloat(itemRate)
    };
    setInvoiceItems([...invoiceItems, newItem]);
    setItemName('');
    setItemRate('');
  };

  const handleRemoveItem = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const gst = (subtotal * gstRate) / 100;
  const total = subtotal + gst;

  const faqs = [
    {
      q: "Is there a free trial period?",
      a: "Yes. We offer a 3-Day Free Trial that allows you to experience the full feature set. You can create up to 10 invoices, download up to 5 PDFs, and test standard templates. No credit card is required to sign up."
    },
    {
      q: "What happens when my 3-day trial ends?",
      a: "After your trial ends, you will be prompted to upgrade to a Pro Monthly or Pro Yearly subscription to continue generating invoices. Your existing customer lists, items, and settings will be preserved."
    },
    {
      q: "Does the system support GST invoicing for Indian businesses?",
      a: "Absolutely. You can select custom GST/IGST/CGST rates, compute totals automatically, and include tax breakdown information on all templates."
    },
    {
      q: "Can I cancel my paid subscription at any time?",
      a: "Yes. You can manage and cancel your active subscription directly from your billing profile page in the portal. You will retain premium features until the end of your paid billing cycle."
    }
  ];



  return (
    <>
      <SEO 
        title="Invoice Port – Free GST Invoice Generator & Billing Software"
        description="Try our 3-Day Free Trial of Invoice Port. Generate professional, GST-compliant invoices in seconds. Includes customizable billing templates, instant PDF download, client tracking & analytics. No credit card required!"
        keywords="GST invoice generator, free invoice maker, billing software India, GST invoicing, professional invoice templates, freelancer billing software, small business invoicing, create invoice online, PDF invoice creator, Invoice Port free trial"
        isHomepage={true}
      />
      <div className="min-h-screen bg-[#0B0F19] text-white font-sans overflow-x-hidden flex flex-col justify-between relative">
        
        {/* Background Radial Glows */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute top-[25%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        </div>

        {/* Header */}
        <Navbar />

        {/* Hero Section with Live Invoice Builder Sandbox */}
        <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-20 w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-32">
            
            {/* Left Column: Hero Text */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-5 text-center lg:text-left space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Next-Gen Billing Suite v2.0
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                Billing made <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Effortless.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience a fast, secure invoicing environment. Customize values in our interactive sandbox to see the live generator preview in action.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto px-8 py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start 3-Day Trial <ArrowRight className="ml-2 h-5 w-5 animate-pulse" />
                </Button>
                <Button 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-8 py-6 border border-white/10 hover:border-indigo-500/50 text-slate-300 hover:text-white rounded-xl text-lg bg-slate-950/40 hover:bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-indigo-500/5"
                >
                  Learn More
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500/80" /> No credit card required
                </div>
                <span className="hidden sm:inline text-slate-800">•</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500/80" /> Up to 10 invoices on trial
                </div>
              </div>
            </motion.div>

            {/* Right Column: Live Interactive Sandbox Invoice Creator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className="lg:col-span-7 w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
            >
              
              {/* Sandbox Control Panel (Forms) */}
              <div className="bg-slate-950/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" /> Sandbox Builder
                  </h3>
                  
                  {/* Client Input */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Client Name</Label>
                    <Input 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="h-10 bg-slate-900/50 border-white/5 text-xs text-white rounded-xl focus:border-indigo-500"
                    />
                  </div>

                  {/* GST Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">GST Rate (%)</Label>
                    <div className="flex gap-2">
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setGstRate(rate)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                            gstRate === rate 
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' 
                              : 'bg-transparent border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add New Line Item Form */}
                  <form onSubmit={handleAddItem} className="space-y-2 pt-2 border-t border-white/5">
                    <Label className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Add Line Item</Label>
                    <div className="grid grid-cols-5 gap-2">
                      <Input 
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Service Name"
                        className="col-span-3 h-9 bg-slate-900/50 border-white/5 text-xs text-white rounded-lg"
                      />
                      <Input 
                        type="number"
                        value={itemRate}
                        onChange={(e) => setItemRate(e.target.value)}
                        placeholder="Rate"
                        className="col-span-2 h-9 bg-slate-900/50 border-white/5 text-xs text-white rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={!itemName || !itemRate}
                      className="w-full h-9 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Service
                    </Button>
                  </form>
                </div>

                {/* Line Item List Scroll Area */}
                <div className="border-t border-white/5 pt-3 mt-4 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {invoiceItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                      <span className="text-slate-300 truncate max-w-[100px]">{item.desc}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">₹{item.rate.toLocaleString('en-IN')}</span>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Sandbox Invoice Preview Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between text-left">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Invoice Preview</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">INV-2026-SANDBOX</p>
                    </div>
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="mb-5">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest block">Client Details</span>
                    <p className="text-white font-bold text-sm truncate">{clientName || 'Unnamed Client'}</p>
                  </div>

                  {/* Mini Line Items Display */}
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                      <span>Description</span>
                      <span>Total</span>
                    </div>
                    <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1">
                      {invoiceItems.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic py-2">No items added to invoice.</p>
                      ) : (
                        invoiceItems.map(item => (
                          <div key={item.id} className="flex justify-between text-[11px] text-slate-300">
                            <span className="truncate max-w-[120px]">{item.desc}</span>
                            <span className="font-medium">₹{item.rate.toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Summary calculations */}
                <div className="space-y-1.5 border-t border-white/5 pt-4 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({gstRate}%)</span>
                    <span className="text-white font-semibold">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 text-sm text-white font-bold">
                    <span>Total</span>
                    <span className="text-indigo-400 font-extrabold">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

              </div>

            </motion.div>

          </div>


          {/* System Capabilities Section */}
          <section id="features" className="py-20 border-t border-white/5 scroll-mt-10">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-indigo-400 font-semibold tracking-widest uppercase text-sm">System Capabilities</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white">Engineered for speed.</h3>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                We stripped away the complexity. What's left is the fastest, most secure way to bill your clients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SpotlightCard>
                <div className="p-3 w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Instant PDF Generation</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Create high-fidelity PDF invoices in milliseconds. Fast server-side rendering ensures zero lag during high-frequency tasks.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Bank-Grade Security</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Protect sensitive billing catalogs. Database details and customer files are isolated using enterprise end-to-end encryption.
                </p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="p-3 w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Real-Time Analytics</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Visualize outstanding client dues and unpaid invoices. Live status dashboard provides an accurate snapshot of cash flow.
                </p>
              </SpotlightCard>
            </div>
          </section>

          {/* Pricing Table Section with billing cycle switcher */}
          <section id="pricing" className="py-20 border-t border-white/5">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-indigo-400 font-semibold tracking-widest uppercase text-sm">Pricing Plans</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white">Simple, transparent pricing</h3>
              <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
                Try the trial plan risk-free. Upgrade when you are ready to scale invoicing.
              </p>

              {/* Billing Cycle Selector Switcher */}
              <div className="flex items-center justify-center gap-3 pt-6">
                <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-semibold' : 'text-slate-400'}`}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-14 h-7 bg-slate-950/80 border border-white/10 rounded-full p-1 relative flex items-center transition-all focus:outline-none"
                  aria-label="Toggle Billing Cycle"
                >
                  <motion.div
                    layout
                    className="w-5 h-5 bg-indigo-500 rounded-full shadow-md"
                    animate={{ x: billingCycle === 'monthly' ? 0 : 26 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className={`text-sm flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  Yearly
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Save ~15%</span>
                </span>
              </div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch pt-8">
              
              {/* TRIAL CARD */}
              <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 flex flex-col justify-between text-left">
                <div className="space-y-6">
                  <div>
                    <span className="text-blue-400 font-bold text-xs uppercase tracking-wider block mb-1">Free Trial</span>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-white">₹0</span>
                      <span className="text-slate-500 ml-2 text-xs">/3 days</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-3">Evaluate all invoice templates risk-free.</p>
                  </div>
                  <ul className="space-y-3.5 border-t border-white/5 pt-5 text-sm text-slate-300">
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-blue-400 flex-shrink-0" /> 10 Invoices Limit</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-blue-400 flex-shrink-0" /> 3 Days Full Access</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-blue-400 flex-shrink-0" /> 5 Downloads Limit</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-blue-400 flex-shrink-0" /> Basic Templates</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl mt-8"
                >
                  Start Trial
                </Button>
              </div>

              {/* PRO MONTHLY CARD */}
              <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/30 flex flex-col justify-between text-left relative overflow-hidden">
                {billingCycle === 'yearly' && (
                  <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/20">Yearly Savings Applied</div>
                )}
                <div className="space-y-6">
                  <div>
                    <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider block mb-1">Pro plan</span>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-white">
                        {billingCycle === 'monthly' ? '₹149' : '₹125'}
                      </span>
                      <span className="text-slate-500 ml-2 text-xs">/month</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-3">Ideal for freelancers, designers, and developers.</p>
                  </div>
                  <ul className="space-y-3.5 border-t border-white/5 pt-5 text-sm text-slate-300">
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Unlimited Invoices</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Unlimited Downloads</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Email Integration</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Custom Branding</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Priority Support</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-8 shadow-lg shadow-indigo-500/20"
                >
                  Get Started
                </Button>
              </div>

              {/* PRO YEARLY CARD */}
              <div className="p-8 rounded-3xl border border-indigo-500/40 bg-slate-800/40 flex flex-col justify-between text-left relative shadow-xl shadow-indigo-500/5">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase py-1 px-4 rounded-full tracking-wider shadow-lg shadow-indigo-500/25">Recommended</div>
                <div className="space-y-6 pt-2">
                  <div>
                    <span className="text-indigo-300 font-bold text-xs uppercase tracking-wider block mb-1">Pro Yearly</span>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-white">₹1,499</span>
                      <span className="text-slate-500 ml-2 text-xs">/year</span>
                    </div>
                    <p className="text-indigo-200/60 text-xs mt-3">Full commitment for growing businesses.</p>
                  </div>
                  <ul className="space-y-3.5 border-t border-white/5 pt-5 text-sm text-indigo-100/90">
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Save ₹289 per year</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Unlimited Invoices</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Unlimited Downloads</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Custom Branding</li>
                    <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /> priority Email Support</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white font-bold rounded-xl mt-8 shadow-lg shadow-indigo-500/25"
                >
                  Buy Yearly Plan
                </Button>
              </div>

            </div>
          </section>

          {/* FAQs Accordions Section */}
          <section id="faqs" className="py-20 border-t border-white/5 max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-indigo-400 font-semibold tracking-widest uppercase text-sm">Got Questions?</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white">Frequently Asked</h3>
            </div>
            
            <div className="space-y-4 text-left">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </section>

        </main>

        {/* Footer */}
        <PublicFooter />
      </div>
    </>
  );
};

export default HomePage;
