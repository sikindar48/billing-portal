import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AdminGuard = ({ children }) => {
  const { isAdmin, authLoading } = useAuth();

  if (authLoading) {
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
          <p className="text-gray-500 mb-6">You do not have permission to view this area.</p>
          <Button
            className="w-full bg-gray-900 text-white"
            onClick={() => window.location.href = '/dashboard'}
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
