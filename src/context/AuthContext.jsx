import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading');
  const [authLoading, setAuthLoading] = useState(true);
  // Tracks whether we've resolved admin+sub at least once for this session
  const resolvedRef = React.useRef(false);

  const resolveUserData = async (u) => {
    if (!u) return { adminStatus: false, subStatus: 'expired' };

    const [adminResult, subResult] = await Promise.allSettled([
      supabase.from('user_roles').select('role').eq('user_id', u.id).eq('role', 'admin').maybeSingle()
        .then(({ data }) => !!data)
        .catch(() => false),

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
    const subStatus = adminStatus ? 'allowed' : (subResult.status === 'fulfilled' ? subResult.value : 'allowed');
    return { adminStatus, subStatus };
  };

  useEffect(() => {
    let mounted = true;

    // Safety net — if auth never resolves (Supabase cold start / network hang),
    // force loading off after 5 seconds so the app doesn't stay stuck forever
    const authTimeout = setTimeout(() => {
      if (mounted) {
        setAuthLoading(false);
        setSubscriptionStatus(prev => prev === 'loading' ? 'expired' : prev);
      }
    }, 5000);

    // Get the current session immediately — this is synchronous from the
    // Supabase client cache and resolves before onAuthStateChange fires.
    // This eliminates the loading flash on tab navigation.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (!sessionUser) {
        clearTimeout(authTimeout);
        setAuthLoading(false);
        setSubscriptionStatus('expired');
        return;
      }

      // Resolve admin + subscription once on startup
      try {
        const { adminStatus, subStatus } = await resolveUserData(sessionUser);
        if (!mounted) return;
        setIsAdmin(adminStatus);
        setSubscriptionStatus(subStatus);
        resolvedRef.current = true;
      } catch {
        if (!mounted) return;
        setSubscriptionStatus('allowed');
      } finally {
        clearTimeout(authTimeout);
        if (mounted) setAuthLoading(false);
      }
    }).catch(() => {
      // getSession itself failed — don't hang
      clearTimeout(authTimeout);
      if (mounted) setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        resolvedRef.current = false;
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

      // TOKEN_REFRESHED or INITIAL_SESSION after getSession already ran —
      // just update the user object, skip DB calls if already resolved
      if (event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && resolvedRef.current)) {
        setUser(sessionUser);
        setAuthLoading(false);
        return;
      }

      // SIGNED_IN (new login) — resolve fresh
      if (event === 'SIGNED_IN') {
        setUser(sessionUser);
        try {
          const { adminStatus, subStatus } = await resolveUserData(sessionUser);
          if (!mounted) return;
          setIsAdmin(adminStatus);
          setSubscriptionStatus(subStatus);
          resolvedRef.current = true;
        } catch {
          if (!mounted) return;
          setSubscriptionStatus('allowed');
        } finally {
          if (mounted) setAuthLoading(false);
        }
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
