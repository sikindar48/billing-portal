import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

// Internal Components
import PlanCard from './components/PlanCard';
import ConfirmModal from './components/ConfirmModal';
import StatusSummary from './components/StatusSummary';
import ProcessingOverlay from './components/ProcessingOverlay';

// Constants & Utils
import { PLANS } from './constants';
import { 
  triggerCelebration, 
  loadRazorpayScript, 
  pollSubscriptionActivated, 
  verifyPaymentWithRetries 
} from './utils/payment';

// Skeleton Loader
const Skeleton = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100 shadow-sm" />
      ))}
    </div>
  </div>
);

const SubscriptionPage = () => {
  const { user, isAdmin, subscription, setSubscription, setSubscriptionStatus, refreshSubscription, authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modal, setModal] = useState({ open: false, plan: null });
  const safetyTimer = useRef(null);

  // Safety net: Edge verify can exceed 30s on cold start
  useEffect(() => {
    if (processing) {
      safetyTimer.current = setTimeout(() => {
        setProcessing(false);
        toast.error(
          'Activation is taking longer than expected. If payment was deducted, wait a moment and refresh the page.',
          { duration: 12000 },
        );
      }, 100_000);
    } else {
      clearTimeout(safetyTimer.current);
    }
    return () => clearTimeout(safetyTimer.current);
  }, [processing]);

  const handlePayment = async (plan) => {
    try {
      await loadRazorpayScript();
    } catch (err) {
      toast.error(err.message);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !session?.user) {
      toast.error('Session expired. Please refresh the page and try again.');
      return;
    }
    const accessToken = session.access_token;

    let orderData;
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('razorpay-create-order', {
        body: { planSlug: plan.slug, planPrice: plan.price, planName: plan.name },
      });

      if (invokeError || !data) {
        throw new Error(invokeError?.message || 'Failed to create order');
      }
      orderData = data;
    } catch (err) {
      toast.error(err.message || 'Could not create payment order. Please try again.');
      return;
    }

    const paymentResponse = await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'InvoicePort',
        description: plan.name,
        prefill: {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
        },
        theme: { color: '#4F46E5' },
        modal: { ondismiss: () => reject(new Error('DISMISSED')) },
        handler: (response) => resolve(response),
      });
      rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')));
      rzp.open();
    }).catch((err) => {
      if (err.message === 'DISMISSED') toast.info('Payment cancelled.');
      else toast.error(err.message || 'Payment failed.');
      return null;
    });

    if (!paymentResponse) return;

    setProcessing(true);
    const toastId = toast.loading('Verifying payment…');

    const activateUI = async (planSlug, planName) => {
      const now = new Date();
      const end = new Date(now);
      if (planSlug === 'monthly') end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);
      const planId = planSlug === 'monthly' ? 2 : 3;

      setSubscription({
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        subscription_plans: { slug: planSlug, name: planName },
      });
      setSubscriptionStatus('allowed');

      const synced = await refreshSubscription({
        expectedPlanSlug: planSlug,
        maxAttempts: 28,
        delayMs: 700,
      });

      setProcessing(false);
      queueMicrotask(() => triggerCelebration());

      toast.success(
        synced
          ? `🎉 Welcome to ${planName}! Your plan is now active.`
          : `Payment received. Your plan is activating — please refresh if it takes too long.`,
        { duration: 7000 },
      );
    };

    const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment-and-activate`;
    const verifyHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    };
    const verifyPayload = {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      planSlug: plan.slug,
      planName: plan.name,
      planPrice: plan.price,
    };

    try {
      const result = await verifyPaymentWithRetries(verifyUrl, accessToken, verifyPayload);
      if (result.ok) {
        toast.dismiss(toastId);
        await activateUI(plan.slug, plan.name);
        return;
      }

      toast.loading('Checking your account…', { id: toastId });
      const reconciled = await pollSubscriptionActivated(user.id, plan.slug);
      toast.dismiss(toastId);

      if (reconciled) {
        await activateUI(plan.slug, plan.name);
        return;
      }

      setProcessing(false);
      toast.error('Activation pending. Please refresh in a moment.');
    } catch (edgeErr) {
      toast.dismiss(toastId);
      setProcessing(false);
      toast.error('Activation error. Contact support if payment was debited.');
    }
  };

  const handlePlanSelect = (plan) => {
    if (plan.slug === 'trial') {
      toast.info('You are already on the free trial.');
      return;
    }

    const currentSlug = subscription?.subscription_plans?.slug;
    const isActive = subscription?.status === 'active' && new Date(subscription?.current_period_end) > new Date();

    if (currentSlug === plan.slug && isActive) {
      toast.info(`You already have the ${plan.name} plan.`);
      return;
    }

    if (currentSlug === 'yearly' && plan.slug === 'monthly' && isActive) {
      toast.error('Downgrading from Yearly to Monthly is not supported.');
      return;
    }

    setModal({ open: true, plan });
  };

  const handleModalConfirm = async () => {
    const plan = modal.plan;
    setModal({ open: false, plan: null });
    await new Promise(r => setTimeout(r, 150));
    await handlePayment(plan);
  };

  if (loading || authLoading) return <Skeleton />;

  const isExpired = subscription ? new Date(subscription.current_period_end) < new Date() : false;

  return (
    <>
      <SEO
        title="Subscription Plans – InvoicePort"
        description="Choose the perfect InvoicePort plan."
        canonicalUrl="/subscription"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3">
              Choose your plan
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Start free, then upgrade to unlock unlimited access.
            </p>
          </div>

          <StatusSummary 
            isAdmin={isAdmin} 
            subscription={subscription} 
            isExpired={isExpired} 
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {PLANS.map((plan) => (
              <PlanCard 
                key={plan.id}
                plan={plan}
                subscription={subscription}
                isAdmin={isAdmin}
                isExpired={isExpired}
                processing={processing}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-violet-50 rounded-2xl p-6 mb-4 border border-violet-100">
              <h3 className="font-semibold text-gray-900 mb-1">Questions? We're here to help</h3>
              <p className="text-sm text-gray-500 mb-3">Reach out for any questions about plans or billing.</p>
              <a href="mailto:info.invoiceport@gmail.com" className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
                Contact Support →
              </a>
            </div>
            <p className="text-xs text-gray-400">
              All prices in INR · No automatic billing · Manual renewal required
            </p>
          </div>
        </div>
      </div>

      {processing && <ProcessingOverlay onDismiss={() => setProcessing(false)} />}

      <ConfirmModal
        isOpen={modal.open}
        plan={modal.plan}
        currentPlanName={subscription?.subscription_plans?.name}
        onClose={() => setModal({ open: false, plan: null })}
        onConfirm={handleModalConfirm}
      />
    </>
  );
};

export default SubscriptionPage;
