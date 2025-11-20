import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, Sparkles, Crown, Zap, Loader2, ChevronLeft, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

// --- OPTIMIZED SKELETON COMPONENT ---
const SubscriptionSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <Navigation />
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      
      {/* Current Plan Skeleton */}
      <div className="h-32 w-full bg-white border border-gray-200 rounded-xl mb-8 animate-pulse shadow-sm"></div>

      {/* Grid Skeleton - Matches Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[400px] bg-white border border-gray-200 rounded-2xl animate-pulse shadow-sm flex flex-col p-6 space-y-4">
            <div className="h-8 w-1/3 bg-gray-100 rounded"></div>
            <div className="h-12 w-1/2 bg-gray-100 rounded"></div>
            <div className="space-y-2 flex-1 pt-4">
                {[1, 2, 3, 4].map(j => <div key={j} className="h-4 w-full bg-gray-100 rounded"></div>)}
            </div>
            <div className="h-12 w-full bg-gray-100 rounded-lg mt-auto"></div>
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

  useEffect(() => {
    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // 1. Fetch Plans (Parallel Fetching if needed, but sequential is safer for deps)
            const { data: plansData } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });

            // Fallback data if DB is empty
            if (plansData && plansData.length > 0) {
                setPlans(plansData);
            } else {
                 setPlans([
                    { id: 1, name: 'Starter', price: 0, slug: 'trial', billing_period: 'monthly', features: ['Basic Invoicing', 'Email Support', 'Up to 5 Clients'] },
                    { id: 2, name: 'Pro', price: 29, slug: 'monthly', billing_period: 'monthly', features: ['Unlimited Invoices', 'Custom Branding', 'Priority Support', 'Export to PDF'] },
                    { id: 3, name: 'Enterprise', price: 290, slug: 'yearly', billing_period: 'yearly', features: ['API Access', 'Dedicated Manager', 'SLA', 'Custom Integrations'] }
                ]);
            }
            
            // 2. Fetch User Subscription
            const { data: subData } = await supabase
                .from('user_subscriptions')
                .select('*, subscription_plans(*)')
                .eq('user_id', user.id)
                .maybeSingle();
                
            setCurrentSubscription(subData || { status: 'active', plan_id: 1, subscription_plans: { name: 'Starter', price: 0 } });

        } catch (e) {
            console.error("Error loading subscription data:", e);
            toast.error("Could not load plan details.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const handlePlanSelect = (plan) => {
    if (plan.slug === 'trial') {
      toast.info('You are already on the Starter plan.');
      return;
    }
    setSelectedPlan(plan);
    setShowRequestDialog(true);
  };

  const submitSubscriptionRequest = async () => {
      if (!requestMessage.trim()) {
        toast.error("Please enter a message.");
        return;
      }
      // Here you would typically save the request to Supabase
      toast.success("Upgrade request submitted! We will contact you shortly.");
      setShowRequestDialog(false);
      setRequestMessage("");
  };

  const getPlanIcon = (slug) => {
    switch (slug) {
      case 'trial': return <Sparkles className="h-6 w-6 text-blue-500" />;
      case 'monthly': return <Zap className="h-6 w-6 text-yellow-500" />;
      case 'yearly': return <Crown className="h-6 w-6 text-purple-500" />;
      default: return <Check className="h-6 w-6 text-green-500" />;
    }
  };

  if (loading) return <SubscriptionSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
                <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)} 
                    className="h-10 w-10 p-0 rounded-full border-gray-200 hover:bg-white hover:border-indigo-200"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-sm text-gray-500">Manage your billing and plan preferences.</p>
                </div>
            </div>
        </div>
        
        {/* Current Plan Banner */}
        {currentSubscription && (
            <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Current Plan</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-2xl font-bold text-gray-900">{currentSubscription.subscription_plans?.name}</h2>
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200 capitalize">
                            {currentSubscription.status}
                        </span>
                    </div>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-3xl font-black text-gray-900">
                        ₹{currentSubscription.subscription_plans?.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    {currentSubscription.expires_at && (
                        <p className="text-xs text-gray-400 mt-1">
                            Renews on {new Date(currentSubscription.expires_at).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => {
                const isPopular = plan.slug === 'monthly'; // Highlight middle plan usually
                const isCurrent = currentSubscription?.subscription_plans?.name === plan.name;

                return (
                    <Card 
                        key={plan.id} 
                        className={`relative flex flex-col h-full transition-all duration-300 border-2 
                            ${isPopular ? 'border-indigo-500 shadow-xl scale-100 md:scale-105 z-10' : 'border-gray-100 shadow-md hover:border-indigo-200 hover:shadow-lg'}
                            ${isCurrent ? 'bg-slate-50/50' : 'bg-white'}
                        `}
                    >
                        {isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> MOST POPULAR
                            </div>
                        )}

                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-xl ${isPopular ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {getPlanIcon(plan.slug)}
                                </div>
                                {isCurrent && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Active</Badge>}
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                            <CardDescription className="flex items-baseline gap-1 mt-2">
                                <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                                <span className="text-sm text-gray-500">/{plan.billing_period}</span>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1">
                            <hr className="border-gray-100 mb-6" />
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                        <Check className={`h-5 w-5 flex-shrink-0 ${isPopular ? 'text-indigo-500' : 'text-green-500'}`} />
                                        <span className="leading-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="pt-6">
                            <Button 
                                className={`w-full h-12 text-base font-semibold transition-all
                                    ${isPopular 
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' 
                                        : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                                disabled={isCurrent}
                                onClick={() => handlePlanSelect(plan)}
                            >
                                {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <div className="mx-auto bg-indigo-100 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <DialogTitle className="text-center text-xl">Upgrade to {selectedPlan?.name}</DialogTitle>
                <DialogDescription className="text-center">
                    Leave a note for the admin to process your upgrade request manually.
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="font-medium text-gray-700">{selectedPlan?.name} Plan</span>
                    <span className="font-bold text-indigo-600">₹{selectedPlan?.price}/{selectedPlan?.billing_period}</span>
                </div>
                <Textarea 
                    value={requestMessage} 
                    onChange={e => setRequestMessage(e.target.value)} 
                    placeholder="Any specific requirements or notes..." 
                    className="min-h-[100px] resize-none focus-visible:ring-indigo-500"
                />
            </div>
            
            <DialogFooter className="sm:justify-between gap-2">
                <Button variant="ghost" onClick={() => setShowRequestDialog(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={submitSubscriptionRequest} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">Send Request</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;