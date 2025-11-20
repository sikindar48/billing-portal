import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminGuard = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        // 1. Hardcoded Fallback (Fastest)
        if (user.email === 'nssoftwaresolutions1@gmail.com') {
            setIsAdmin(true);
            setIsLoading(false);
            return;
        }

        // 2. Database Check (Robost)
        const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        if (roleData) {
            setIsAdmin(true);
        }

      } catch (error) {
        console.error("Admin check failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                <div className="mx-auto bg-red-100 h-16 w-16 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">
                    You do not have permission to view this area.
                </p>
                <Button 
                    className="w-full bg-gray-900 text-white"
                    onClick={() => window.location.href = '/'}
                >
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
  }

  return children;
};

export default AdminGuard;