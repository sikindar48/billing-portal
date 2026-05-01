import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAuth();

  // Always wait for auth to finish before making any redirect decision.
  // Redirecting while authLoading=true causes false logouts on slow connections.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
