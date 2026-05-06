import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { NavigationSkeleton } from './SkeletonLoader';

/**
 * AppLoader wraps the entire app and shows a loading skeleton
 * while the auth context is initializing
 */
export const AppLoader = ({ children }) => {
  const { authLoading } = useAuth();

  // Show skeleton while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationSkeleton />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AppLoader;
