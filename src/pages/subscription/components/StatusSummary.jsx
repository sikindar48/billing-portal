import React from 'react';
import { ShieldCheck } from 'lucide-react';

const StatusSummary = ({ isAdmin, subscription, isExpired }) => {
  return (
    <div className="max-w-xl mx-auto mb-10">
      <div className={`p-4 rounded-2xl border text-center transition-all ${
        isAdmin 
          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
          : !subscription || isExpired
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200 shadow-sm'
      }`}>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Your Current Status</div>
        <div className="flex items-center justify-center gap-2">
          {isAdmin ? (
            <span className="text-xl font-bold text-indigo-700 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> System Administrator
            </span>
          ) : (
            <span className={`text-xl font-bold ${!subscription || isExpired ? 'text-amber-700' : 'text-emerald-700'}`}>
              {!subscription ? 'Free Trial' : isExpired ? 'Expired Plan' : subscription.subscription_plans?.name}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin 
            ? 'You have unlimited access to all platform features.'
            : !subscription || isExpired
              ? 'Upgrade to unlock unlimited invoices and premium features.'
              : `Your ${subscription.subscription_plans?.name} is active.`}
        </p>
      </div>
    </div>
  );
};

export default StatusSummary;
