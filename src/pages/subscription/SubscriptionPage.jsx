import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, Info, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import confetti from 'canvas-confetti';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PLANS = [
  {
    id: 'starter',
    slug: 'trial',
    name: 'Free Starter',
    price: 0,
    period: '',
    description: 'Essential tools for new businesses.',
    features: ['10 Invoices Limit', '3 Days Access', '5 Downloads Limit', 'Basic Templates'],
    highlight: false,
  },
  {
    id: 'pro-monthly',
    slug: 'monthly',
    name: 'Pro Monthly',
    price: 149,
    period: '/month',
    description: 'For freelancers & growing businesses.',
    features: ['Unlimited Invoices', 'Unlimited Downloads', 'Email Integration', 'Priority Support', 'Custom Branding'],
    highlight: false,
  },
  {
    id: 'pro-yearly',
    slug: 'yearly',
    name: 'Pro Yearly',
    price: 1499,
    period: '/year',
    description: 'Best value for committed users.',
    features: ['Unlimited Invoices', 'Unlimited Downloads', 'Email Integration', 'Priority Support', 'Custom Branding'],
    highlight: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function triggerCelebration() {
  const duration = 3000;
  const end = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  const rand = (min, max) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const count = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount: count, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount: count, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#FF6347', '#4F46E5', '#10B981'],
    zIndex: 9999,
  });
}

async function loadRazorpayScript() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay. Check your connection or disable ad blockers.'));
    document.body.appendChild(script);
  });
}

/** Poll DB until paid plan matches (handles lost HTTP response after Edge Function succeeded). */
async function pollSubscriptionActivated(userId, expectedSlug, { attempts = 24, delayMs = 2500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, current_period_end, subscription_plans(slug)')
      .eq('user_id', userId)
      .maybeSingle();

    const planRow = data?.subscription_plans;
    const slug =
      planRow && typeof planRow === 'object' && !Array.isArray(planRow)
        ? planRow.slug
        : Array.isArray(planRow)
          ? planRow[0]?.slug
          : null;

    if (!error && data && slug === expectedSlug) {
      const end = data.current_period_end ? new Date(data.current_period_end) : null;
      const active =
        (data.status === 'active' || data.status === 'trialing') && end && end > new Date();
      if (active) return true;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

/** Verify payment with long timeout + retries (cold Edge starts, flaky mobile networks). */
async function verifyPaymentWithRetries(url, accessToken, payload) {
  const maxAttempts = 4;
  const perAttemptTimeoutMs = 85_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), perAttemptTimeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));

      if (res.ok) return { ok: true, data, status: res.status };

      const retryable = res.status >= 502 && res.status <= 504;
      if (retryable && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return { ok: false, data, status: res.status };
    } catch (e) {
      clearTimeout(timer);
      const aborted = e?.name === 'AbortError';
      const network = e instanceof TypeError || aborted;
      if (network && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return { ok: false, data: {}, status: 0, error: e };
    }
  }
  return { ok: false, data: {}, status: 0 };
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------
const ConfirmModal = ({ isOpen, onClose, onConfirm, plan, currentPlanName }) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Upgrade</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
            {currentPlanName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Current Plan</span>
                <span className="font-medium text-gray-800">{currentPlanName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">New Plan</span>
              <span className="font-medium text-indigo-600">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-900">₹{plan.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-gray-800">
                {plan.slug === 'monthly' ? '1 Month' : '1 Year'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>No automatic billing. Manual renewal required after the plan expires.</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700" onClick={onConfirm}>
            Pay ₹{plan.price}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
const Skeleton = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100 shadow-sm" />
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Processing Overlay
// ---------------------------------------------------------------------------
const ProcessingOverlay = ({ onDismiss }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4 max-w-sm mx-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
      <h3 className="text-lg font-semibold text-gray-900">Activating Your Plan</h3>
      <p className="text-sm text-gray-500">Verifying payment and upgrading your account…</p>
      <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
        Taking too long? Dismiss
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const SubscriptionPage = () => {
  const { user, subscription, setSubscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modal, setModal] = useState({ open: false, plan: null });
  const safetyTimer = useRef(null);

  // Safety net: Edge verify can exceed 30s on cold start; align with fetch timeout + retries
  useEffect(() => {
    if (processing) {
      safetyTimer.current = setTimeout(() => {
        setProcessing(false);
        toast.error(
          'Activation is taking longer than expected. If payment was deducted, wait a moment and refresh the page — your plan may already be active.',
          { duration: 12000 },
        );
      }, 100_000);
    } else {
      clearTimeout(safetyTimer.current);
    }
    return () => clearTimeout(safetyTimer.current);
  }, [processing]);

  // -------------------------------------------------------------------------
  // Core payment flow
  // -------------------------------------------------------------------------

  const handlePayment = async (plan) => {
    // ── Step 1: load script + get session BEFORE opening Razorpay ──────────
    // We capture the token now so it's ready the moment payment succeeds.
    // Never fetch session inside the Razorpay handler — it can hang.
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
    const accessToken = session.access_token; // captured before modal opens

    // ── Step 2: create Razorpay order ──────────────────────────────────────
    let orderData;
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ planSlug: plan.slug, planPrice: plan.price, planName: plan.name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Order creation failed (${res.status})`);
      orderData = body;
    } catch (err) {
      toast.error(err.message || 'Could not create payment order. Please try again.');
      return;
    }

    // ── Step 3: open Razorpay checkout ─────────────────────────────────────
    // The handler is synchronous from Razorpay's perspective.
    // We store the payment response and resolve the promise immediately,
    // then do all async work OUTSIDE the handler.
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
        handler: (response) => resolve(response), // just resolve, no async here
      });
      rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')));
      rzp.open();
    }).catch((err) => {
      if (err.message === 'DISMISSED') toast.info('Payment cancelled.');
      else toast.error(err.message || 'Payment failed.');
      return null;
    });

    if (!paymentResponse) return; // user dismissed or payment failed

    // ── Step 4: verify + activate (all async, outside Razorpay handler) ────
    setProcessing(true);
    const toastId = toast.loading('Verifying payment…');

    const activateUI = (planSlug, planName) => {
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
      setProcessing(false);
      triggerCelebration();
      toast.success(`🎉 Welcome to ${planName}! Your plan is now active.`, { duration: 6000 });
      if (typeof refreshSubscription === 'function') refreshSubscription();

      // Confirmation email is sent from verify-payment-and-activate (server) so it still fires if the browser misses the response.

      // Sync real data from DB after 3s
      setTimeout(async () => {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setSubscription(data);
      }, 3000);
    };

    const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment-and-activate`;
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
      const data = result.data || {};

      if (result.ok) {
        console.log('[verify] OK', data);
        toast.dismiss(toastId);
        activateUI(plan.slug, plan.name);
        return;
      }

      console.warn('[verify] non-OK after retries', result.status, data);

      // Server may have succeeded while the client saw 502/abort — reconcile from DB
      toast.loading('Checking your account…', { id: toastId });
      const reconciled = await pollSubscriptionActivated(user.id, plan.slug);
      toast.dismiss(toastId);

      if (reconciled) {
        setProcessing(false);
        toast.success('Payment verified! Your plan is now active.', { duration: 6000 });
        activateUI(plan.slug, plan.name);
        return;
      }

      setProcessing(false);
      toast.error(
        `We could not confirm activation yet (payment ID: ${paymentResponse.razorpay_payment_id}). If money was debited, wait one minute, refresh this page, or contact support at info.invoiceport@gmail.com with your Payment ID.`,
        { duration: 16000 },
      );
    } catch (edgeErr) {
      console.error('[verify] unexpected error:', edgeErr?.message || edgeErr);

      toast.dismiss(toastId);
      const reconciled = await pollSubscriptionActivated(user.id, plan.slug);
      if (reconciled) {
        setProcessing(false);
        toast.success('Payment verified! Your plan is now active.', { duration: 6000 });
        activateUI(plan.slug, plan.name);
        return;
      }

      setProcessing(false);
      toast.error(
        `We could not confirm activation yet (payment ID: ${paymentResponse.razorpay_payment_id}). If money was debited, wait one minute, refresh this page, or contact support at info.invoiceport@gmail.com with your Payment ID.`,
        { duration: 16000 },
      );
    }
  };

  // -------------------------------------------------------------------------
  // Plan selection logic
  // -------------------------------------------------------------------------
  const handlePlanSelect = (plan) => {
    if (plan.slug === 'trial') {
      const currentSlug = subscription?.subscription_plans?.slug;
      if (currentSlug === 'monthly' || currentSlug === 'yearly') {
        toast.info('You are already on a Pro plan. Downgrading is not supported.');
      } else {
        toast.info('You are already on the free trial. Upgrade to a Pro plan for unlimited access.');
      }
      return;
    }

    const currentSlug = subscription?.subscription_plans?.slug;
    const isActive = subscription?.status === 'active' &&
      new Date(subscription?.current_period_end) > new Date();

    if (currentSlug === plan.slug && isActive) {
      toast.info(`You already have the ${plan.name} plan.`);
      return;
    }

    // Block downgrade: yearly → monthly
    if (currentSlug === 'yearly' && plan.slug === 'monthly' && isActive) {
      toast.error('Downgrading from Yearly to Monthly is not supported. Your yearly plan is valid until it expires.', { duration: 4000 });
      return;
    }

    // Show confirmation modal before opening Razorpay
    setModal({ open: true, plan });
  };

  const handleModalConfirm = async () => {
    const plan = modal.plan;
    setModal({ open: false, plan: null });
    // Small delay so modal closes before Razorpay opens
    await new Promise(r => setTimeout(r, 150));
    await handlePayment(plan);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) return <Skeleton />;

  const currentSlug = subscription?.subscription_plans?.slug;
  const isExpired = subscription
    ? new Date(subscription.current_period_end) < new Date()
    : false;

  return (
    <>
      <SEO
        title="Subscription Plans – InvoicePort"
        description="Choose the perfect InvoicePort plan. Free trial, Pro Monthly (₹149), Pro Yearly (₹1499)."
        keywords="invoice port pricing, subscription plans, pro plan"
        canonicalUrl="/subscription"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50">
        <div className="container mx-auto px-4 py-12 max-w-6xl">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3">
              Choose your plan
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Start free, then upgrade to unlock unlimited access.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {PLANS.map((plan) => {
              const isCurrent = currentSlug === plan.slug ||
                (plan.slug === 'trial' && !subscription);
              const isActive = isCurrent && !isExpired;
              // Prevent visual downgrade: yearly → monthly
              const isDowngrade = currentSlug === 'yearly' && plan.slug === 'monthly' && !isExpired;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl flex flex-col transition-all duration-200 ${
                    plan.highlight
                      ? 'border-2 border-violet-300 shadow-xl'
                      : 'border border-gray-200 shadow-md hover:shadow-lg'
                  } ${isActive ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''} ${isDowngrade ? 'opacity-50' : ''}`}
                >
                  {/* Popular badge */}
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Active badge */}
                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col h-full">
                    {/* Plan info */}
                    <div className="mb-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                        {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                      </div>

                      {plan.slug === 'yearly' && (
                        <span className="inline-block mt-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Save ₹289/year
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                            plan.highlight ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Expiry info */}
                    {isCurrent && subscription?.current_period_end && (
                      <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs">
                        <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {isExpired ? 'Expired ' : 'Expires '}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      onClick={() => handlePlanSelect(plan)}
                      disabled={isActive || isDowngrade || processing}
                      className={`w-full h-11 rounded-xl font-medium text-sm transition-all ${
                        isActive || isDowngrade
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                          : plan.highlight
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {isDowngrade
                        ? 'Not Available'
                        : isActive
                          ? 'Current Plan'
                          : isCurrent && isExpired
                            ? 'Renew Plan'
                            : subscription && !isExpired && plan.slug !== 'trial'
                              ? `Upgrade to ${plan.name}`
                              : plan.slug === 'trial'
                                ? 'Free Plan'
                                : 'Get Started'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-violet-50 rounded-2xl p-6 mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Questions? We're here to help</h3>
              <p className="text-sm text-gray-500 mb-3">Reach out for any questions about plans or billing.</p>
              <a
                href="mailto:info.invoiceport@gmail.com"
                className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                Contact Support →
              </a>
            </div>
            <p className="text-xs text-gray-400">
              All prices in INR · No automatic billing · Manual renewal required
            </p>
          </div>

        </div>
      </div>

      {/* Overlays */}
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
