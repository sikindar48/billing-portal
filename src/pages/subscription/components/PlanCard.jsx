import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PlanCard = ({ 
  plan, 
  subscription, 
  isAdmin, 
  isExpired, 
  processing, 
  onSelect 
}) => {
  const currentSlug = subscription?.subscription_plans?.slug;
  const isCurrent = currentSlug === plan.slug || (plan.slug === 'trial' && !subscription);
  const isActive = isCurrent && !isExpired;
  const isDowngrade = currentSlug === 'yearly' && plan.slug === 'monthly' && !isExpired;
  const isDisabled = isActive || isDowngrade || processing || isAdmin;

  return (
    <div
      className={`relative bg-white rounded-2xl flex flex-col transition-all duration-200 ${
        plan.highlight
          ? 'border-2 border-violet-300 shadow-xl'
          : 'border border-gray-200 shadow-md hover:shadow-lg'
      } ${isActive ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''} ${isDowngrade ? 'opacity-50' : ''}`}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isExpired ? 'Expired' : 'Active'}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
            {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
          </div>

          {plan.slug === 'yearly' && (
            <span className="inline-block mt-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Save ₹289/year
            </span>
          )}
        </div>

        <ul className="space-y-3 flex-1 mb-6">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                plan.highlight ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <Check className="w-2.5 h-2.5" />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {isCurrent && subscription?.current_period_end && (
          <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs">
            <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-500'}>
              {isExpired ? 'Expired ' : 'Expires '}
            </span>
            <span className="font-semibold text-gray-800">
              {new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        )}

        <Button
          onClick={() => onSelect(plan)}
          disabled={isDisabled}
          className={`w-full h-11 rounded-xl font-medium text-sm transition-all ${
            isActive || isDowngrade || (isAdmin && !isCurrent)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
              : plan.highlight
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
          }`}
        >
          {isAdmin 
            ? (isCurrent ? 'Admin Active' : 'Restricted for Admin')
            : isDowngrade
              ? 'Not Available'
              : isActive
                ? 'Current Plan'
                : isCurrent && isExpired
                  ? 'Renew Plan'
                  : subscription && !isExpired && plan.slug !== 'trial'
                    ? `Upgrade to ${plan.name}`
                    : plan.slug === 'trial'
                      ? 'Free Plan'
                      : 'Get Started'}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;
