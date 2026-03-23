import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading');
  const [authLoading, setAuthLoading] = useState(true);

  const resolveUserData = async (u) => {
    if (!u) return { adminStatus: false, subStatus: 'expired' };

    // Run both DB calls in parallel instead of sequentially
    const [adminResult, subResult] = await Promise.allSettled([
      // Admin check — DB is the sole source of truth (no client-side email list)
      supabase.from('user_roles').select('role').eq('user_id', u.id).eq('role', 'admin').maybeSingle()
        .then(({ data }) => !!data)
        .catch(() => false),

      // Subscription check
      supabase.from('user_subscriptions')
        .select('status, current_period_end')
        .eq('user_id', u.id)
        .maybeSingle()
        .then(({ data: sub }) => {
          if (!sub) return 'expired';
          const now = new Date();
          const end = new Date(sub.current_period_end);
          if (sub.status === 'active' || (sub.status === 'trialing' && end > now)) return 'allowed';
          return 'expired';
        })
        .catch(() => 'allowed'),
    ]);

    const adminStatus = adminResult.status === 'fulfilled' ? adminResult.value : false;
    // Admins always get 'allowed' regardless of subscription
    const subStatus = adminStatus ? 'allowed' : (subResult.status === 'fulfilled' ? subResult.value : 'allowed');

    return { adminStatus, subStatus };
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        setAuthLoading(false);
        return;
      }

      const sessionUser = session?.user ?? null;

      if (!sessionUser) {
        setUser(null);
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        setAuthLoading(false);
        return;
      }

      // TOKEN_REFRESHED — user identity unchanged, skip DB calls
      if (event === 'TOKEN_REFRESHED') {
        setUser(sessionUser);
        setAuthLoading(false);
        return;
      }

      // INITIAL_SESSION or SIGNED_IN — resolve admin + subscription in parallel
      setUser(sessionUser);
      try {
        const { adminStatus, subStatus } = await resolveUserData(sessionUser);
        if (!mounted) return;
        setIsAdmin(adminStatus);
        setSubscriptionStatus(subStatus);
      } catch {
        if (!mounted) return;
        setIsAdmin(false);
        setSubscriptionStatus('allowed'); // fail open
      } finally {
        if (mounted) setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, subscriptionStatus, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
