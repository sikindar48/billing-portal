import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, Sparkles, Crown, Zap, Loader2, ChevronLeft } from 'lucide-react'; // Added ChevronLeft
import Navigation from '@/components/Navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom'; // Added useNavigate

// --- NEW: SKELETON LOADING COMPONENT for Perceived Performance ---
const SubscriptionSkeleton = () => (
  <div className="min-h-screen bg-gray-50 pt-16">
    <div className="container mx-auto p-8">
      <div className="text-center mb-12">
        <div className="h-10 w-80 bg-gray-200 mx-auto rounded-lg mb-4 animate-pulse"></div>
        <div className="h-6 w-96 bg-gray-100 mx-auto rounded-lg animate-pulse"></div>
      </div>
      
      <div className="h-32 w-full bg-gray-100 rounded-xl mb-8 animate-pulse"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse border-2 border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-10 w-1/2 bg-gray-300 mt-4 rounded"></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <li key={j} className="h-5 w-full bg-gray-100 rounded"></li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  </div>
);
// --- END SKELETON COMPONENT ---

const SubscriptionPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch available plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      setPlans(plansData || []);

      // Fetch current subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .single();

      setCurrentSubscription(subData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    if (plan.slug === 'trial') {
      toast.error('Trial plan is automatically assigned to new users');
      return;
    }

    setSelectedPlan(plan);
    setShowRequestDialog(true);
  };

  const submitSubscriptionRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please add a message for the admin');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('subscription_requests')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          message: requestMessage,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Subscription request submitted! Admin will review it soon.');
      setShowRequestDialog(false);
      setRequestMessage('');
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Error submitting request');
      console.error(error);
    }
  };

  const getPlanIcon = (slug) => {
    switch (slug) {
      case 'trial':
        return <Sparkles className="h-6 w-6" />;
      case 'monthly':
        return <Zap className="h-6 w-6" />;
      case 'yearly':
        return <Crown className="h-6 w-6" />;
      default:
        return <Check className="h-6 w-6" />;
    }
  };

  if (loading) {
    // Renders the Skeleton Screen immediately for better perceived performance
    return <SubscriptionSkeleton />;
  }

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan_id === planId;
  };

  return (
    // Added background gradient for better aesthetics
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br from-indigo-50/50 to-white pt-8">
      {/* Assuming Navigation is handled by the parent layout/router */}
      {/* Removed <Navigation /> from here as it should be in App.jsx */}

      <div className="container mx-auto p-4 sm:p-8">
        {/* Back Button and Header */}
        <div className="flex items-center justify-between mb-12">
            <Button 
                variant="outline" 
                onClick={() => navigate(-1)} // Navigate back one step
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
            </Button>
            <div className="text-center flex-1 -ml-32 md:-ml-0">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Choose Your Plan</h1>
                <p className="text-lg text-gray-600">
                    Select the perfect plan to unlock all features
                </p>
            </div>
            <div className="w-40 md:w-auto"></div> {/* Spacer to align title */}
        </div>

        {/* Current Subscription Card */}
        {currentSubscription && (
          <Card className="mb-10 bg-blue-600/10 border-blue-400/50 shadow-xl border-l-4">
            <CardHeader>
              <CardTitle className="text-blue-800 text-2xl font-bold">Current Subscription</CardTitle>
              <CardDescription className="text-blue-700">
                You're currently on the **{currentSubscription.subscription_plans?.name}** plan. Thank you!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-blue-700">
                    ₹{currentSubscription.subscription_plans?.price}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    per {currentSubscription.subscription_plans?.billing_period}
                  </div>
                </div>
                <Badge 
                  variant="default" 
                  className="bg-green-500 hover:bg-green-600 text-white shadow-md px-3 py-1 text-base"
                >
                  {currentSubscription.status}
                </Badge>
              </div>
              {currentSubscription.expires_at && (
                <p className="text-sm text-gray-500 mt-4">
                  Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const features = Array.isArray(plan.features) ? plan.features : [];
            const isCurrent = isCurrentPlan(plan.id);
            const isPopular = plan.slug === 'yearly';

            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] ${
                  isPopular ? 'border-4 border-indigo-500 shadow-3xl bg-white' : 'border border-gray-200 shadow-lg'
                } ${isCurrent ? 'bg-green-50/50 border-green-400/70' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white font-bold text-sm px-4 py-1 rounded-full shadow-xl">
                      ⭐ Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${isPopular ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                      {getPlanIcon(plan.slug)}
                    </div>
                    {isCurrent && <Badge variant="secondary" className="bg-green-400 text-white">Current Plan</Badge>}
                  </div>
                  <CardTitle className="text-3xl font-extrabold text-gray-900">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="text-4xl font-black text-indigo-600 mt-4">
                      ₹{plan.price}
                      <span className="text-base font-normal text-gray-500 ml-1">
                        /{plan.billing_period === 'yearly' ? 'year' : plan.billing_period}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-4">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-base text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full text-base py-6 transition-all duration-200 ${isPopular ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' : 'border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50'}`}
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {plan.slug === 'trial' ? 'Already Active' : 'Request Plan'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center p-6 bg-gray-100 rounded-xl border border-gray-300 shadow-inner">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Payment Notice:</span> Payment gateway integration is currently in development. For now, please submit a request, and an administrator will review and activate your subscription manually.
          </p>
        </div>
      </div>

      {/* Subscription Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Request {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Submit your subscription request. Admin will review and activate it manually.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2 text-gray-700">Plan Details:</p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold text-gray-800">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-indigo-600">₹{selectedPlan?.price}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">
                Message to Admin <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Provide payment details or any additional information..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitSubscriptionRequest} className="bg-indigo-600 hover:bg-indigo-700">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;