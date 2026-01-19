import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, CheckCircle, XCircle } from 'lucide-react';

const AuthChecker = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkAuth = async () => {
    try {
      setChecking(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      console.log('=== Authentication Check ===');
      console.log('Auth Data:', authData);
      console.log('Auth Error:', authError);
      console.log('Has User:', !!authData?.user);
      console.log('User ID:', authData?.user?.id);
      console.log('User Email:', authData?.user?.email);
      console.log('============================');
      
      if (authError) {
        setAuthStatus({ 
          authenticated: false, 
          error: authError.message 
        });
        toast.error(`Authentication error: ${authError.message}`);
      } else if (authData?.user) {
        setAuthStatus({ 
          authenticated: true, 
          user: authData.user 
        });
        toast.success(`Authenticated as: ${authData.user.email}`);
      } else {
        setAuthStatus({ 
          authenticated: false, 
          error: 'No user session found' 
        });
        toast.error('Not authenticated - please log in');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthStatus({ 
        authenticated: false, 
        error: error.message 
      });
      toast.error(`Auth check failed: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Authentication Status
      </h3>
      
      <div className="space-y-3">
        <Button 
          onClick={checkAuth}
          disabled={checking}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500"
        >
          {checking ? 'Checking...' : 'Check Authentication'}
        </Button>
        
        {authStatus && (
          <div className={`p-3 rounded-lg border ${
            authStatus.authenticated 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {authStatus.authenticated ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`font-semibold ${
                authStatus.authenticated ? 'text-green-800' : 'text-red-800'
              }`}>
                {authStatus.authenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
            
            {authStatus.authenticated ? (
              <div className="text-sm text-green-700">
                <p><strong>User ID:</strong> {authStatus.user.id}</p>
                <p><strong>Email:</strong> {authStatus.user.email}</p>
              </div>
            ) : (
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {authStatus.error}
              </p>
            )}
          </div>
        )}
      </div>
      
      <p className="text-xs text-blue-700 mt-2">
        Use this to verify you're logged in before connecting Gmail.
      </p>
    </div>
  );
};

export default AuthChecker;