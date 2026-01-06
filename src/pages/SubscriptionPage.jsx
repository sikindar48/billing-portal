import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Sparkles, Crown, Zap, Loader2, ChevronLeft, Star, AlertTriangle, ShieldCheck, Mail, Info, CalendarClock, QrCode, Copy, CreditCard, Smartphone } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

const SubscriptionSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <Navigation />
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-16 space-y-4">
        <div className="h-10 w-64 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
        <div className="h-6 w-96 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[500px] bg-white border border-gray-100 rounded-3xl animate-pulse shadow-sm flex flex-col p-8 space-y-6">
            <div className="h-12 w-12 bg-gray-100 rounded-xl"></div>
            <div className="h-8 w-2/3 bg-gray-100 rounded"></div>
            <div className="space-y-3 flex-1 pt-4">
                {[1, 2, 3, 4, 5].map(j => <div key={j} className="h-4 w-full bg-gray-100 rounded"></div>)}
            </div>
            <div className="h-14 w-full bg-gray-100 rounded-xl mt-auto"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); 
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  const [hoveredPlanId, setHoveredPlanId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Define UI-Rich Plans (We use these for display to ensure icons/colors work)
            const displayPlans = [
                { 
                    id: 'starter', 
                    name: 'Free Starter', 
                    price: 0, 
                    period: '',
                    slug: 'trial', 
                    icon: <Sparkles className="w-5 h-5" />,
                    color: "blue",
                    description: 'Essential tools for new businesses.',
                    features: ['10 Invoices Limit', '3 Days Access', '5 Downloads Limit', 'Basic Templates'] 
                },
                { 
                    id: 'pro', 
                    name: 'Pro', 
                    price: billingCycle === 'monthly' ? 149 : 1499, 
                    slug: billingCycle === 'monthly' ? 'monthly' : 'yearly_pro', 
                    icon: <Zap className="w-5 h-5" />,
                    color: "indigo",
                    description: 'For freelancers & growing businesses.',
                    highlight: true,
                    features: ['Unlimited Invoices', 'Unlimited Downloads', 'Email Integration', 'Priority Support', 'Custom Branding'] 
                },
                { 
                    id: 'enterprise', 
                    name: 'Enterprise', 
                    price: 'Custom', 
                    slug: 'enterprise', 
                    icon: <ShieldCheck className="w-5 h-5" />,
                    color: "slate",
                    description: 'For large teams requiring control.',
                    features: ['Custom Templates', 'Dedicated Manager', 'SLA Support', 'Custom Features'] 
                }
            ];

            setPlans(displayPlans);
            
            if (user) {
                const { data: subData } = await supabase
                    .from('user_subscriptions')
                    .select('*, subscription_plans(*)')
                    .eq('user_id', user.id)
                    .maybeSingle();
                setCurrentSubscription(subData);
            }

        } catch (e) {
            console.error("Error loading subscription data:", e);
            toast.error("Could not load plan details.", { duration: 2000 });
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [billingCycle]);

  const handlePlanSelect = async (plan) => {
    if (plan.slug === 'trial') {
      toast.info('You are already on the free tier.', { duration: 1500 });
      return;
    }
    
    if (plan.id === 'enterprise') {
      // For enterprise, show the request dialog
      const planWithCycle = { ...plan, selectedCycle: billingCycle };
      setSelectedPlan(planWithCycle);
      setShowRequestDialog(true);
      return;
    }
    
    // For Pro plan, show payment dialog with QR code
    const planWithCycle = { ...plan, selectedCycle: billingCycle };
    setSelectedPlan(planWithCycle);
    
    // Generate UPI QR code
    try {
      const amount = plan.price;
      const upiId = 'invoiceport@ybl';
      const merchantName = 'InvoicePort';
      const transactionNote = `${plan.name} Plan - ${billingCycle}`;
      
      // UPI URL format
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      
      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrDataUrl);
      setShowPaymentDialog(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate payment QR code', { duration: 2000 });
    }
  };

  const submitSubscriptionRequest = async () => {
      if (!requestMessage.trim()) {
        toast.error("Please enter a brief note.", { duration: 2000 });
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
             // Map UI IDs to DB IDs
             let dbPlanId = 1; 
             if (selectedPlan.id === 'pro') dbPlanId = 2;
             if (selectedPlan.id === 'enterprise') dbPlanId = 3;

             await supabase.from('subscription_requests').insert({
                user_id: user.id,
                plan_id: dbPlanId,
                message: `Requesting ${selectedPlan.name} Plan (${billingCycle}). Note: ${requestMessage}`,
                status: 'pending'
             });
        }
        toast.success("Request submitted! We'll contact you shortly.", { duration: 2500 });
        setShowRequestDialog(false);
        setRequestMessage("");
      } catch(e) {
        console.error(e);
        toast.success("Request received! We will contact you.", { duration: 2500 }); 
        setShowRequestDialog(false);
      }
  };

  const submitPaymentVerification = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter your transaction ID.", { duration: 2000 });
      return;
    }
    
    setIsSubmittingPayment(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Map UI IDs to DB IDs
        let dbPlanId = 2; // Pro plan
        
        const message = `Payment made for ${selectedPlan.name} Plan (${billingCycle}). Amount: ₹${selectedPlan.price}. Transaction ID: ${transactionId.trim()}. UPI ID: invoiceport@ybl`;
        
        console.log('Submitting payment verification:', {
          user_id: user.id,
          plan_id: dbPlanId,
          message: message,
          status: 'pending'
        });
        
        // Try with transaction_id column first, fallback to message only
        let insertData = {
          user_id: user.id,
          plan_id: dbPlanId,
          message: message,
          status: 'pending'
        };
        
        // Try to add transaction_id if column exists
        try {
          insertData.transaction_id = transactionId.trim();
          const { data, error } = await supabase.from('subscription_requests').insert(insertData);
          
          if (error) throw error;
          console.log('Payment verification submitted successfully with transaction_id:', data);
        } catch (dbError) {
          // If transaction_id column doesn't exist, try without it
          if (dbError.message && dbError.message.includes('transaction_id')) {
            console.log('transaction_id column not found, submitting without it');
            delete insertData.transaction_id;
            const { data, error } = await supabase.from('subscription_requests').insert(insertData);
            
            if (error) throw error;
            console.log('Payment verification submitted successfully without transaction_id:', data);
          } else {
            throw dbError;
          }
        }
        
        toast.success("Payment verification submitted! We'll activate your plan within 24 hours.", { duration: 4000 });
        setShowPaymentDialog(false);
        setTransactionId("");
        setQrCodeUrl("");
      }
    } catch (error) {
      console.error('Error submitting payment verification:', error);
      toast.error("Failed to submit payment verification. Please try again.", { duration: 3000 });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('invoiceport@ybl');
    toast.success('UPI ID copied to clipboard!', { duration: 1500 });
  };

  const getIconBgClass = (color, isActive, isEnterprise) => {
      if (isEnterprise) return 'bg-slate-800 text-white';
      if (!isActive) return 'bg-slate-100 text-slate-500';
      switch(color) {
          case 'blue': return 'bg-blue-100 text-blue-600';
          case 'indigo': return 'bg-indigo-100 text-indigo-600';
          case 'slate': return 'bg-slate-200 text-slate-700';
          default: return 'bg-indigo-100 text-indigo-600';
      }
  };
  
  // Updated Button Class Logic for Enterprise
  const getButtonClass = (color, isActive, isCurrent, isEnterprise) => {
      const base = "w-full h-10 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm";
      
      if (isCurrent) return `${base} bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200`;

      if (isEnterprise) return `${base} bg-white text-slate-900 hover:bg-slate-200 hover:text-black`;

      if (!isActive) return `${base} bg-slate-100 text-slate-900 hover:bg-slate-200`;
      
      switch(color) {
          case 'blue': return `${base} bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30`;
          case 'indigo': return `${base} bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30`;
          default: return `${base} bg-indigo-600 hover:bg-indigo-700 text-white`;
      }
  };

  if (loading) return <SubscriptionSkeleton />;
  
  const isExpired = currentSubscription ? new Date(currentSubscription.current_period_end) < new Date() : false;
  const statusColor = isExpired ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  const statusText = isExpired ? 'Expired' : currentSubscription?.status || 'Inactive';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* --- HEADER & TOGGLE (Moved Up) --- */}
        <div className="text-center mb-12 -mt-6 space-y-4 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                Pricing that scales with you
            </h1>
            <p className="text-base text-slate-500 max-w-2xl mx-auto">
                Simple, transparent pricing. No hidden fees. Cancel anytime.
            </p>
            
            {/* Smart Toggle */}
            <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-sm relative transition-all hover:border-indigo-300">
                <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 relative z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 relative z-10 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Yearly
                </button>
                
                {/* Sliding Background */}
                <div className={`absolute top-1 bottom-1 w-[50%] bg-indigo-600 rounded-md shadow-sm transition-transform duration-300 ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full left-[-4px]'}`}></div>
            </div>
            
            {billingCycle === 'yearly' && (
                <div className="animate-fade-in-down">
                    <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Save ~16% on yearly
                    </span>
                </div>
            )}
        </div>

        {/* --- PRICING CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {plans.map((plan, index) => {
                const isHighlighted = plan.highlight; 
                const isEnterprise = plan.slug === 'enterprise';
                
                const isCurrentPlan = currentSubscription?.subscription_plans?.name === plan.name 
                    || (plan.id === 'pro' && (currentSubscription?.subscription_plans?.slug === 'monthly' || currentSubscription?.subscription_plans?.slug === 'yearly'))
                    || (plan.id === 'starter' && currentSubscription?.subscription_plans?.slug === 'trial');
                
                const isActiveUI = hoveredPlanId === plan.id || (hoveredPlanId === null && isHighlighted) || isCurrentPlan;
                
                // Dynamic Styles based on Enterprise Mode
                const cardBg = isEnterprise ? 'bg-slate-900 text-white' : 'bg-white';
                const textColor = isEnterprise ? 'text-white' : 'text-slate-900';
                const mutedText = isEnterprise ? 'text-slate-400' : 'text-slate-500';
                const borderColor = isEnterprise ? 'border-slate-800' : 'border-slate-200';

                return (
                    <div 
                        key={plan.id}
                        onMouseEnter={() => setHoveredPlanId(plan.id)}
                        onMouseLeave={() => setHoveredPlanId(null)}
                        className={`relative flex flex-col p-6 rounded-3xl transition-all duration-500 ease-out transform cursor-default border
                            ${cardBg} ${borderColor}
                            ${isCurrentPlan 
                                ? `ring-4 ${isExpired ? 'ring-red-100 border-red-300' : 'ring-emerald-50 border-emerald-500'} shadow-xl z-20` 
                                : isActiveUI 
                                    ? `shadow-xl -translate-y-2 z-10 ${!isEnterprise && `border-${plan.color}-500 shadow-${plan.color}-500/10`}` 
                                    : 'shadow-sm opacity-90 hover:opacity-100'
                            }
                        `}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* BADGES (Top) */}
                        {isCurrentPlan ? (
                            <div className="absolute -top-3 left-0 right-0 flex justify-center z-30">
                                <span className={`text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1 ${isExpired ? 'bg-red-600' : 'bg-emerald-600'}`}>
                                    {isExpired ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                    {isExpired ? 'Plan Expired' : 'Current Plan'}
                                </span>
                            </div>
                        ) : isHighlighted && (
                            <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg flex items-center gap-1.5">
                                    <Star className="w-3 h-3 fill-current" /> Best Value
                                </span>
                            </div>
                        )}

                        <div className="mb-4 relative">
                            <div className="flex justify-between items-start">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${getIconBgClass(plan.color, isActiveUI, isEnterprise)}`}>
                                    {plan.icon}
                                </div>
                                {/* Status Badge inside card */}
                                {isCurrentPlan && (
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border font-bold ${statusColor} block mb-1`}>
                                            {statusText}
                                        </span>
                                        {currentSubscription?.current_period_end && (
                                            <p className={`text-[10px] font-mono ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {isExpired ? 'Ended: ' : 'Renews: '} 
                                                {new Date(currentSubscription.current_period_end).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <h3 className={`text-xl font-bold ${textColor}`}>{plan.name}</h3>
                            <p className={`text-xs ${mutedText} mt-1 min-h-[32px] leading-relaxed`}>{plan.description}</p>
                        </div>

                        <div className={`mb-6 border-b pb-4 ${isEnterprise ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="flex items-baseline gap-0.5">
                                {isEnterprise ? (
                                    <span className={`text-3xl font-extrabold ${textColor}`}>Custom</span>
                                ) : (
                                    <>
                                        <span className={`text-4xl font-extrabold ${textColor} tracking-tight`}>₹{plan.price}</span>
                                        <span className={`text-sm font-medium ${mutedText}`}>{plan.period}</span>
                                    </>
                                )}
                            </div>
                            {plan.slug === 'yearly_pro' && billingCycle === 'yearly' && !isCurrentPlan && (
                                <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Save ₹289/yr
                                </p>
                            )}
                        </div>

                        <ul className="space-y-3 mb-6 flex-1">
                            {plan.features.map((f, i) => (
                                <li key={i} className={`flex items-start gap-2.5 text-sm ${mutedText}`}>
                                    <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 
                                        ${isEnterprise 
                                            ? 'bg-slate-800 text-slate-300' 
                                            : isActiveUI ? `bg-${plan.color}-100 text-${plan.color}-600` : 'bg-slate-100 text-slate-400'
                                        }`
                                    }>
                                        <Check className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="leading-snug text-xs">{f}</span>
                                </li>
                            ))}
                        </ul>

                        <CardFooter className="p-0 pt-2">
                            <Button 
                                onClick={() => handlePlanSelect(plan)}
                                className={getButtonClass(plan.color, isActiveUI, isCurrentPlan, isEnterprise)}
                                disabled={isCurrentPlan && !isExpired} 
                            >
                                {isCurrentPlan 
                                    ? (isExpired ? 'Renew Now' : 'Active Plan') 
                                    : isEnterprise ? 'Contact Sales' : `Choose ${plan.name}`}
                            </Button>
                        </CardFooter>
                    </div>
                );
            })}
        </div>

        {/* --- TERMS & CONDITIONS FOOTER --- */}
        <div className="border-t border-slate-200 pt-12 pb-8 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-2.5 bg-indigo-50 rounded-full mb-4">
                <Info className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">100% Satisfaction Guarantee</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 px-4">
                We want you to be completely happy with InvoicePort. If you encounter any issues with your subscription or the service doesn't meet your needs, 
                we offer a refund. Simply email us at <a href="mailto:support.invoiceport@gmail.com" className="text-indigo-600 font-medium hover:underline">support.invoiceport@gmail.com</a> and we will process it immediately.
            </p>
            <p className="text-[10px] text-slate-400">
                * Prices are in Indian Rupees (INR). By subscribing, you agree to our Terms of Service. 
                Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.
            </p>
        </div>

      </div>

      {/* --- UPGRADE DIALOG --- */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl">
            <div className={`p-6 text-center ${selectedPlan?.id === 'enterprise' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                <div className="mx-auto bg-white/20 h-12 w-12 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                    <Zap className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-lg text-white mb-0.5">
                    {selectedPlan?.id === 'enterprise' ? 'Contact Sales' : `Upgrade to ${selectedPlan?.name}`}
                </DialogTitle>
                <DialogDescription className="text-indigo-100 text-xs">
                    {selectedPlan?.id === 'enterprise' ? 'Get a custom quote for your team.' : 'Unlock professional features today.'}
                </DialogDescription>
            </div>
            
            <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Selected Plan</p>
                        <p className="font-bold text-slate-900 text-sm">{selectedPlan?.name}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs font-medium text-slate-500">Total Price</p>
                         <p className="text-lg font-bold text-indigo-600">
                            {selectedPlan?.price === 'Custom' ? 'Custom' : `₹${selectedPlan?.price}`}
                            <span className="text-xs font-normal text-slate-400 ml-1">
                                {selectedPlan?.price !== 'Custom' && (billingCycle === 'monthly' ? '/mo' : '/yr')}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Additional Notes</label>
                    <Textarea 
                        value={requestMessage} 
                        onChange={e => setRequestMessage(e.target.value)} 
                        placeholder={selectedPlan?.id === 'enterprise' ? "Tell us about your team size and requirements..." : "E.g. I prefer UPI payment link..."}
                        className="min-h-[80px] resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-white text-sm text-slate-800"
                    />
                </div>
            </div>
            
            <DialogFooter className="p-6 pt-0 sm:justify-between gap-3 bg-white">
                <Button variant="ghost" onClick={() => setShowRequestDialog(false)} className="w-full sm:w-auto text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-10">Cancel</Button>
                <Button onClick={submitSubscriptionRequest} className={`w-full sm:w-auto text-white font-semibold shadow-lg ${selectedPlan?.id === 'enterprise' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-700'} h-10`}>
                    Send Request
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- PAYMENT DIALOG WITH QR CODE --- */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl">
            <div className="p-4 text-center bg-green-600">
                <div className="mx-auto bg-white/20 h-10 w-10 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                    <QrCode className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-base text-white mb-0.5">
                    Complete Payment
                </DialogTitle>
                <DialogDescription className="text-green-100 text-xs">
                    Scan QR code or pay using UPI ID
                </DialogDescription>
            </div>
            
            <div className="p-4 space-y-4">
                {/* Plan Details - Compact */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-medium text-slate-500">{selectedPlan?.name}</p>
                        <p className="text-xs text-slate-400">{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{selectedPlan?.price}</p>
                    </div>
                </div>

                {/* QR Code Section - Reduced Size */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                            {qrCodeUrl && (
                              <img 
                                src={qrCodeUrl} 
                                alt="UPI Payment QR Code" 
                                className="w-32 h-32"
                              />
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-600">Or pay using UPI ID:</p>
                        <div className="flex items-center justify-center gap-2 bg-slate-50 p-2 rounded-lg border">
                            <Smartphone className="w-3 h-3 text-slate-500" />
                            <code className="font-mono text-xs font-bold text-slate-900">invoiceport@ybl</code>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={copyUpiId}
                              className="h-5 w-5 p-0 hover:bg-slate-200"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Transaction ID Input - Compact */}
                <div className="space-y-2 border-t pt-3">
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                            <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                                <p className="font-medium">After payment, enter your transaction ID for verification.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <Label htmlFor="transactionId" className="text-xs font-semibold text-slate-700">
                            Transaction ID *
                        </Label>
                        <Input
                            id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter UPI transaction ID"
                            className="h-8 text-sm border-slate-200 focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                </div>
            </div>
            
            <DialogFooter className="p-4 pt-0 sm:justify-between gap-2 bg-white">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setTransactionId('');
                    setQrCodeUrl('');
                  }} 
                  className="w-full sm:w-auto text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-8 text-xs"
                  disabled={isSubmittingPayment}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitPaymentVerification} 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg h-8 text-xs"
                  disabled={isSubmittingPayment || !transactionId.trim()}
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3 h-3 mr-1" />
                      Verify Payment
                    </>
                  )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in-down { animation: fadeInDown 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;