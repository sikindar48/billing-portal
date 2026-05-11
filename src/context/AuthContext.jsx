import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

// Production-grade caching helper
const CACHE_KEY = 'invoiceport_auth_v2';
const getCachedAuth = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    // Only use cache if it's less than 48 hours old
    if (Date.now() - data.timestamp > 1000 * 60 * 60 * 48) return null;
    return data;
  } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const initialCache = getCachedAuth();
  
  const [user, setUser] = useState(initialCache?.user || null);
  const [isAdmin, setIsAdmin] = useState(initialCache?.isAdmin || false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(initialCache?.subscriptionStatus || 'loading');
  const [subscription, setSubscription] = useState(initialCache?.subscription || null);
  const [authLoading, setAuthLoading] = useState(!initialCache); 

  const updateCache = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }));
    } catch (e) { console.warn('Cache update failed', e); }
  }, []);

  const resolveUserData = useCallback(async (u) => {
    if (!u) return { adminStatus: false, subStatus: 'expired', subscriptionData: null };

    // Background revalidation logic
    try {
      const [adminRes, subRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', u.id).eq('role', 'admin').maybeSingle(),
        supabase.from('subscriptions').select('*, plans(*)').eq('user_id', u.id).maybeSingle()
      ]);

      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
      const isEmailAdmin = u.email ? adminEmails.includes(u.email.toLowerCase()) : false;
      const adminStatus = !!adminRes.data || isEmailAdmin;

      let subStatus = 'expired';
      const sub = subRes.data;
      if (sub) {
        const now = new Date();
        const end = new Date(sub.current_period_end);
        if (end > now) subStatus = 'allowed';
      }
      
      // Admin bypass for subscription
      if (adminStatus) subStatus = 'allowed';

      return { adminStatus, subStatus, subscriptionData: sub };
    } catch (err) {
      console.error('Revalidation failed:', err);
      return null; // Signals to keep current state
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const data = await resolveUserData(u);
      if (data) {
        setIsAdmin(data.adminStatus);
        setSubscriptionStatus(data.subStatus);
        setSubscription(data.subscriptionData);
        updateCache({ user: u, isAdmin: data.adminStatus, subscriptionStatus: data.subStatus, subscription: data.subscriptionData });
      }
    }
  }, [resolveUserData, updateCache]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      
      if (!mounted) return;
      setUser(sessionUser);

      if (!sessionUser) {
        setAuthLoading(false);
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        localStorage.removeItem(CACHE_KEY);
        return;
      }

      // Background revalidate
      const data = await resolveUserData(sessionUser);
      if (mounted && data) {
        setIsAdmin(data.adminStatus);
        setSubscriptionStatus(data.subStatus);
        setSubscription(data.subscriptionData);
        setAuthLoading(false);
        updateCache({ user: sessionUser, isAdmin: data.adminStatus, subscriptionStatus: data.subStatus, subscription: data.subscriptionData });
      } else if (mounted) {
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sUser = session?.user ?? null;
      if (!mounted) return;
      setUser(sUser);

      if (sUser) {
        const data = await resolveUserData(sUser);
        if (mounted && data) {
          setIsAdmin(data.adminStatus);
          setSubscriptionStatus(data.subStatus);
          setSubscription(data.subscriptionData);
          updateCache({ user: sUser, isAdmin: data.adminStatus, subscriptionStatus: data.subStatus, subscription: data.subscriptionData });
        }
      } else {
        setIsAdmin(false);
        setSubscriptionStatus('expired');
        localStorage.removeItem(CACHE_KEY);
      }
    });

    return () => {
      mounted = false;
      authListener.unsubscribe();
    };
  }, [resolveUserData, updateCache]);

  const value = useMemo(() => ({
    user,
    isAdmin,
    subscription,
    subscriptionStatus,
    setSubscription,
    setSubscriptionStatus,
    refreshSubscription,
    authLoading
  }), [user, isAdmin, subscription, subscriptionStatus, refreshSubscription, authLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
