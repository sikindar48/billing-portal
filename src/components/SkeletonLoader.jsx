import React from 'react';

// Navigation Skeleton
export const NavigationSkeleton = () => (
  <nav className="bg-gradient-to-r from-indigo-600 to-blue-700 shadow-xl sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 bg-indigo-400/30 rounded animate-pulse" />
          <div className="h-6 w-32 bg-indigo-400/30 rounded animate-pulse" />
        </div>
        
        {/* Desktop Nav Items */}
        <div className="hidden md:flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 bg-indigo-400/30 rounded-full animate-pulse" />
          ))}
        </div>
        
        {/* User Menu */}
        <div className="h-10 w-32 bg-indigo-400/30 rounded-full animate-pulse" />
      </div>
    </div>
  </nav>
);

// Dashboard Page Skeleton
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Customers Page Skeleton
export const CustomersSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Inventory Page Skeleton
export const InventorySkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Invoice History Skeleton
export const InvoiceHistorySkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Profile Page Skeleton
export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Form Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

// Subscription Page Skeleton
export const SubscriptionSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
        <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="space-y-3 mb-6">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Admin Dashboard Skeleton
export const AdminDashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Generic Page Skeleton
export const PageSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <NavigationSkeleton />
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);
