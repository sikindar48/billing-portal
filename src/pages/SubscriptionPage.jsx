import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, Sparkles, Crown, Zap, Loader2, ChevronLeft, Star, AlertTriangle, ShieldCheck, Mail, Info, CalendarClock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

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
  const [billingCycle, setBillingCycle] = useState('monthly'); 
  
  const [hoveredPlanId, setHoveredPlanId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const displayPlans = [
                { 
                    id: 'starter', 
                    name: 'Free Starter', 
                    price: 0, 
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
                    features: ['Dedicated Manager', 'Custom Templates', 'SLA Support', 'API Access', 'Team Management'] 
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
            toast.error("Could not load plan details.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [billingCycle]);

  const handlePlanSelect = (plan) => {
    if (plan.slug === 'trial') {
      toast.info('You are already on the free tier.');
      return;
    }
    const planWithCycle = { ...plan, selectedCycle: billingCycle };
    setSelectedPlan(planWithCycle);
    setShowRequestDialog(true);
  };

  const submitSubscriptionRequest = async () => {
      if (!requestMessage.trim()) {
        toast.error("Please enter a brief note.");
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
        toast.success("Request submitted! We'll contact you shortly.");
        setShowRequestDialog(false);
        setRequestMessage("");
      } catch(e) {
        console.error(e);
        toast.success("Request received! We will contact you."); 
        setShowRequestDialog(false);
      }
  };

  const getButtonClass = (color, isActive, isCurrent) => {
      const base = "w-full h-10 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm";
      if (isCurrent) return `${base} bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200`;
      if (!isActive) return `${base} bg-slate-100 text-slate-900 hover:bg-slate-200`;
      
      switch(color) {
          case 'blue': return `${base} bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30`;
          case 'indigo': return `${base} bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30`;
          case 'slate': return `${base} bg-slate-800 hover:bg-slate-900 text-white shadow-slate-500/30`;
          default: return `${base} bg-indigo-600 hover:bg-indigo-700 text-white`;
      }
  };

  const getIconBgClass = (color, isActive) => {
      if (!isActive) return 'bg-slate-100 text-slate-500';
      switch(color) {
          case 'blue': return 'bg-blue-100 text-blue-600';
          case 'indigo': return 'bg-indigo-100 text-indigo-600';
          case 'slate': return 'bg-slate-200 text-slate-700';
          default: return 'bg-indigo-100 text-indigo-600';
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
                
                return (
                    <div 
                        key={plan.id}
                        onMouseEnter={() => setHoveredPlanId(plan.id)}
                        onMouseLeave={() => setHoveredPlanId(null)}
                        className={`relative flex flex-col p-6 rounded-3xl transition-all duration-500 ease-out transform cursor-default bg-white
                            ${isCurrentPlan 
                                ? `border-[2px] ${isExpired ? 'border-red-300 ring-4 ring-red-50' : 'border-emerald-500 ring-4 ring-emerald-50'} shadow-xl z-20` 
                                : isActiveUI 
                                    ? `border-2 border-${plan.color}-500 shadow-xl shadow-${plan.color}-500/10 -translate-y-1 z-10` 
                                    : 'border border-slate-200 shadow-sm opacity-90 hover:opacity-100'
                            }
                        `}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* BADGES */}
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
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${getIconBgClass(plan.color, isActiveUI)}`}>
                                    {plan.icon}
                                </div>
                                {isCurrentPlan && (
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border font-bold ${statusColor} block mb-1`}>
                                            {statusText}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="mb-6 border-b border-slate-100 pb-4">
                            <div className="flex items-baseline gap-0.5">
                                {isEnterprise ? (
                                    <span className="text-3xl font-extrabold text-slate-900">Custom</span>
                                ) : (
                                    <>
                                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">₹{plan.price}</span>
                                        <span className="text-sm font-medium text-slate-400">{plan.period}</span>
                                    </>
                                )}
                            </div>
                            {plan.slug === 'yearly_pro' && billingCycle === 'yearly' && !isCurrentPlan && (
                                <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Save ₹289/yr
                                </p>
                            )}
                        </div>

                        {/* Current Plan Renewal Info */}
                        {isCurrentPlan && currentSubscription?.current_period_end && (
                             <div className={`mb-4 p-2.5 rounded-lg border text-center ${isExpired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                 <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 flex items-center justify-center gap-1">
                                    <CalendarClock className="w-3 h-3" />
                                    {isExpired ? 'Expired On' : 'Renews On'}
                                 </p>
                                 <p className="text-xs font-mono font-bold">
                                    {new Date(currentSubscription.current_period_end).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                                 </p>
                             </div>
                        )}

                        <ul className="space-y-3 mb-6 flex-1">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                                    <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${isActiveUI ? `bg-${plan.color}-100 text-${plan.color}-600` : 'bg-slate-100 text-slate-400'}`}>
                                        <Check className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="leading-snug text-xs">{f}</span>
                                </li>
                            ))}
                        </ul>

                        <CardFooter className="p-0 pt-2">
                            <Button 
                                onClick={() => handlePlanSelect(plan)}
                                className={getButtonClass(plan.color, isActiveUI, isCurrentPlan)}
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

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in-down { animation: fadeInDown 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;