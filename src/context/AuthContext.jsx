import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

// Helper to get initial state from localStorage for faster boot
const getCachedAuth = () => {
  try {
    const cached = localStorage.getItem('invoiceport_auth_cache');
    if (!cached) return null;
    const data = JSON.parse(cached);
    // Only use cache if it's less than 24 hours old
    if (Date.now() - data.timestamp > 1000 * 60 * 60 * 24) return null;
    return data;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const cache = getCachedAuth();
  
  const [user, setUser] = useState(cache?.user || null);
  const [isAdmin, setIsAdmin] = useState(cache?.isAdmin || false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(cache?.subscriptionStatus || 'loading');
  const [subscription, setSubscription] = useState(cache?.subscription || null);
  const [authLoading, setAuthLoading] = useState(!cache); // If we have a cache, don't block UI
  
  // Tracks whether we've resolved admin+sub at least once for this session
  const resolvedRef = React.useRef(!!cache);

  const resolveUserData = async (u) => {
    if (!u) return { adminStatus: false, subStatus: 'expired', subscriptionData: null };

    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve('TIMEOUT'), 5000)
    );

    const dataPromise = Promise.allSettled([
      supabase.from('user_roles').select('role').eq('user_id', u.id).eq('role', 'admin').maybeSingle()
        .then(({ data }) => !!data)
        .catch(() => false),

      supabase.from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', u.id)
        .maybeSingle()
        .then(({ data: sub }) => {
          if (!sub) return { subStatus: 'expired', subscriptionData: null };
          const now = new Date();
          const end = new Date(sub.current_period_end);
          if (sub.status === 'active' || (sub.status === 'trialing' && end > now)) {
            return { subStatus: 'allowed', subscriptionData: sub };
          }
          return { subStatus: 'expired', subscriptionData: sub };
        })
        .catch(() => ({ subStatus: 'allowed', subscriptionData: null })),
    ]);

    const result = await Promise.race([dataPromise, timeoutPromise]);

    if (result === 'TIMEOUT') {
      console.warn('resolveUserData timed out after 5 seconds');
      return { adminStatus: false, subStatus: 'allowed', subscriptionData: null };
    }

    const [adminResult, subResult] = result;
    const adminStatus = adminResult.status === 'fulfilled' ? adminResult.value : false;
    
    let subStatus = 'allowed';
    let subscriptionData = null;
    
    if (subResult.status === 'fulfilled') {
      subStatus = subResult.value.subStatus;
      subscriptionData = subResult.value.subscriptionData;
    }
    
    if (adminStatus) subStatus = 'allowed';
    
    return { adminStatus, subStatus, subscriptionData };
  };

  useEffect(() => {
    let mounted = true;
    let authResolved = false;

    const authTimeout = setTimeout(() => {
      if (mounted && !authResolved) {
        console.warn('Auth timeout reached - forcing authLoading to false');
        setAuthLoading(false);
        authResolved = true;
      }
    }, 3000);

    const updateCache = (data) => {
      try {
        localStorage.setItem('invoiceport_auth_cache', JSON.stringify({
          ...data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to update auth cache', e);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (!sessionUser) {
        clearTimeout(authTimeout);
        setAuthLoading(false);
        setSubscriptionStatus('expired');
        setSubscription(null);
        localStorage.removeItem('invoiceport_auth_cache');
        authResolved = true;
        return;
      }

      try {
        const { adminStatus, subStatus, subscriptionData } = await resolveUserData(sessionUser);
        if (!mounted) return;
        setIsAdmin(adminStatus);
        setSubscriptionStatus(subStatus);
        setSubscription(subscriptionData);
        resolvedRef.current = true;
        
        // Update cache for next refresh
        updateCache({
          user: sessionUser,
          isAdmin: adminStatus,
          subscriptionStatus: subStatus,
          subscription: subscriptionData
        });

      } catch {
        if (!mounted) return;
        setSubscriptionStatus('allowed');
      } finally {
        clearTimeout(authTimeout);
        if (mounted) {
          setAuthLoading(false);
          authResolved = true;
        }
      }
    }).catch((err) => {
      console.error('getSession error:', err);
      clearTimeout(authTimeout);
      if (mounted) {
        setAuthLoading(false);
        authResolved = true;
      }
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        setSubscription(null);
        resolvedRef.current = false;
        setAuthLoading(false);
        authResolved = true;
        localStorage.removeItem('invoiceport_auth_cache');
        return;
      }

      const sessionUser = session?.user ?? null;

      if (!sessionUser) {
        setUser(null);
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        setSubscription(null);
        setAuthLoading(false);
        authResolved = true;
        localStorage.removeItem('invoiceport_auth_cache');
        return;
      }

      if (event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && resolvedRef.current)) {
        setUser(sessionUser);
        setAuthLoading(false);
        authResolved = true;
        return;
      }

      if (event === 'SIGNED_IN') {
        setUser(sessionUser);
        // Don't show loading if we already have data (e.g. from cache or session update)
        if (!resolvedRef.current) setSubscriptionStatus('loading');
        
        try {
          const { adminStatus, subStatus, subscriptionData } = await resolveUserData(sessionUser);
          if (!mounted) return;
          setIsAdmin(adminStatus);
          setSubscriptionStatus(subStatus);
          setSubscription(subscriptionData);
          resolvedRef.current = true;
          
          updateCache({
            user: sessionUser,
            isAdmin: adminStatus,
            subscriptionStatus: subStatus,
            subscription: subscriptionData
          });
        } catch {
          if (!mounted) return;
          setSubscriptionStatus('allowed');
        } finally {
          if (mounted) {
            setAuthLoading(false);
            authResolved = true;
          }
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      authListener.unsubscribe();
    };
  }, []);

  const refreshSubscription = async () => {
    const currentUser = user;
    if (!currentUser) return;
    try {
      const { adminStatus, subStatus, subscriptionData } = await resolveUserData(currentUser);
      setIsAdmin(adminStatus);
      setSubscriptionStatus(subStatus);
      setSubscription(subscriptionData);
    } catch {
      setSubscriptionStatus('allowed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, subscriptionStatus, subscription, setSubscription, authLoading, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
