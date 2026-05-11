import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [subscriptionStatus, setSubscriptionStatus] = useState(cache?.subscriptionStatus || (cache ? 'allowed' : 'loading'));
  const [subscription, setSubscription] = useState(cache?.subscription || null);
  const [authLoading, setAuthLoading] = useState(!cache); 
  const [isAuthResolved, setIsAuthResolved] = useState(!!cache);
  
  // Tracks whether we've resolved admin+sub at least once for this session
  const resolvedRef = React.useRef(!!cache);

  const updateCache = useCallback((data) => {
    try {
      localStorage.setItem('invoiceport_auth_cache', JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Failed to update auth cache', e);
    }
  }, []);

  const resolveUserData = useCallback(async (u) => {
    if (!u) return { adminStatus: false, subStatus: 'expired', subscriptionData: null };

    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve('TIMEOUT'), 15000)
    );

    const dataPromise = Promise.allSettled([
      supabase.from('user_roles').select('role').eq('user_id', u.id).eq('role', 'admin').maybeSingle()
        .then(({ data }) => {
          console.log('AuthContext: Admin check result:', !!data);
          return !!data;
        })
        .catch((err) => {
          console.error('AuthContext: Admin check error:', err);
          return false;
        }),

      supabase.from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', u.id)
        .maybeSingle()
        .then(({ data: sub }) => {
          const now = new Date();
          
          if (!sub) {
            // New user without a subscription record yet - 3 day free trial from creation
            const createdAt = new Date(u.created_at);
            const trialEnd = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
            if (now > trialEnd) return { subStatus: 'expired', subscriptionData: null };
            return { subStatus: 'allowed', subscriptionData: null };
          }
          
          const end = new Date(sub.current_period_end);
          // BUG FIX: Check end date for 'active' plans as well
          if ((sub.status === 'active' || sub.status === 'trialing') && end > now) {
            return { subStatus: 'allowed', subscriptionData: sub };
          }
          return { subStatus: 'expired', subscriptionData: sub };
        })
        .catch(() => ({ subStatus: 'expired', subscriptionData: null })),
    ]);

    const result = await Promise.race([dataPromise, timeoutPromise]);

    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isEmailAdmin = u.email ? adminEmails.includes(u.email.toLowerCase()) : false;

    if (result === 'TIMEOUT') {
      console.warn('resolveUserData timed out after 15 seconds');
      // Use email fallback even on timeout for better UX
      return { 
        adminStatus: isEmailAdmin, 
        subStatus: 'allowed', 
        subscriptionData: null, 
        isTimeout: true 
      };
    }

    const [adminResult, subResult] = result;
    const adminStatus = (adminResult.status === 'fulfilled' ? adminResult.value : false) || isEmailAdmin;
    
    let subStatus = 'allowed';
    let subscriptionData = null;
    
    if (subResult.status === 'fulfilled') {
      subStatus = subResult.value.subStatus;
      subscriptionData = subResult.value.subscriptionData;
    }
    
    if (adminStatus) subStatus = 'allowed';
    
    return { adminStatus, subStatus, subscriptionData };
  }, []);

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
        const result = await resolveUserData(sessionUser);
        const { adminStatus, subStatus, subscriptionData, isTimeout } = result;
        
        if (!mounted) return;
        
        // If it's a timeout, we keep the cached values if we have them
        // otherwise we proceed with defaults
        if (!isTimeout || !resolvedRef.current) {
          setIsAdmin(adminStatus);
          setSubscriptionStatus(subStatus);
          setSubscription(subscriptionData);
          resolvedRef.current = true;
          setIsAuthResolved(true);
          
          // Update cache for next refresh
          updateCache({
            user: sessionUser,
            isAdmin: adminStatus,
            subscriptionStatus: subStatus,
            subscription: subscriptionData
          });
        } else {
          // It's a timeout but we already had resolved data (from cache)
          // We keep the cache and just mark auth as resolved
          setIsAuthResolved(true);
        }

      } catch (err) {
        console.error("AuthContext: resolveUserData error:", err);
        if (!mounted) return;
        // Fallback to allowed to not block users on transient DB errors
        setSubscriptionStatus('allowed');
      } finally {
        clearTimeout(authTimeout);
        if (mounted) {
          setAuthLoading(false);
          setIsAuthResolved(true);
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
        setIsAuthResolved(false);
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
          const result = await resolveUserData(sessionUser);
          const { adminStatus, subStatus, subscriptionData, isTimeout } = result;
          
          if (!mounted) return;
          
          if (!isTimeout || !resolvedRef.current) {
            setIsAdmin(adminStatus);
            setSubscriptionStatus(subStatus);
            setSubscription(subscriptionData);
            resolvedRef.current = true;
            setIsAuthResolved(true);
            
            updateCache({
              user: sessionUser,
              isAdmin: adminStatus,
              subscriptionStatus: subStatus,
              subscription: subscriptionData
            });
          } else {
            setIsAuthResolved(true);
          }
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
  }, [resolveUserData, updateCache]);

  /** Optional expectedPlanSlug: poll until DB matches (post-payment replication / RPC lag). */
  const refreshSubscription = useCallback(
    async (opts = {}) => {
      const currentUser = user;
      if (!currentUser) return false;

      const expectedPlanSlug = opts.expectedPlanSlug;
      const delayMs = opts.delayMs ?? 700;
      const maxAttempts = opts.maxAttempts ?? 28;

      const planSlugFromRow = (sub) => {
        if (!sub) return null;
        const sp = sub.subscription_plans;
        if (sp && typeof sp === 'object' && !Array.isArray(sp)) return sp.slug ?? null;
        if (Array.isArray(sp)) return sp[0]?.slug ?? null;
        return null;
      };

      const rowLooksPaidForExpected = (sub) => {
        if (!sub || !expectedPlanSlug) return true;
        const slug = planSlugFromRow(sub);
        const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
        const activeWindow = end && end > new Date();
        const activeStatus = sub.status === 'active' || sub.status === 'trialing';
        return slug === expectedPlanSlug && activeStatus && activeWindow;
      };

      const applyResolved = ({ adminStatus, subStatus, subscriptionData }) => {
        setIsAdmin(adminStatus);
        setSubscriptionStatus(subStatus);
        setSubscription(subscriptionData);
        updateCache({
          user: currentUser,
          isAdmin: adminStatus,
          subscriptionStatus: subStatus,
          subscription: subscriptionData,
        });
      };

      for (let i = 0; i < maxAttempts; i++) {
        try {
          const resolved = await resolveUserData(currentUser);
          if (resolved.adminStatus) {
            applyResolved(resolved);
            return true;
          }
          if (!expectedPlanSlug || rowLooksPaidForExpected(resolved.subscriptionData)) {
            applyResolved(resolved);
            return true;
          }
        } catch {
          setSubscriptionStatus('allowed');
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        const resolved = await resolveUserData(currentUser);
        if (
          resolved.adminStatus ||
          !expectedPlanSlug ||
          rowLooksPaidForExpected(resolved.subscriptionData)
        ) {
          applyResolved(resolved);
          return true;
        }
      } catch {
        setSubscriptionStatus('allowed');
      }
      return false;
    },
    [user, resolveUserData, updateCache],
  );

  const refreshAuth = useCallback(() => {
    const currentUser = user;
    if (!currentUser) return;
    resolveUserData(currentUser).then((result) => {
      const { adminStatus, subStatus, subscriptionData, isTimeout } = result;
      if (isTimeout) return; // Don't update on timeout
      
      setIsAdmin(adminStatus);
      setSubscriptionStatus(subStatus);
      setSubscription(subscriptionData);
      updateCache({
        user: currentUser,
        isAdmin: adminStatus,
        subscriptionStatus: subStatus,
        subscription: subscriptionData,
      });
    });
  }, [user, resolveUserData, updateCache]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      subscriptionStatus, 
      subscription, 
      setSubscription,
      setSubscriptionStatus,
      authLoading,
      isAuthResolved,
      isPro: subscriptionStatus === 'allowed' || isAdmin,
      refreshAuth,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
