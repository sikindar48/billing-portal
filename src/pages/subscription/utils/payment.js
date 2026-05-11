import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export function triggerCelebration() {
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

export async function loadRazorpayScript() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay. Check your connection or disable ad blockers.'));
    document.body.appendChild(script);
  });
}

/** Poll DB until paid plan matches */
export async function pollSubscriptionActivated(userId, expectedSlug, { attempts = 24, delayMs = 2500 } = {}) {
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

/** Verify payment with long timeout + retries */
export async function verifyPaymentWithRetries(url, accessToken, payload) {
  const maxAttempts = 4;
  const perAttemptTimeoutMs = 85_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), perAttemptTimeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
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
