import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
