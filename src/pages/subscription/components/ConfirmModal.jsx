import React from 'react';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConfirmModal = ({ isOpen, onClose, onConfirm, plan, currentPlanName }) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Confirm Upgrade</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 bg-white">
          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm border border-gray-100">
            {currentPlanName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Current Plan</span>
                <span className="font-medium text-gray-800">{currentPlanName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">New Plan</span>
              <span className="font-medium text-indigo-600">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-900">₹{plan.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-gray-800">
                {plan.slug === 'monthly' ? '1 Month' : '1 Year'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>No automatic billing. Manual renewal required after the plan expires.</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex gap-3 border-t border-gray-100">
          <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-[0.98]" onClick={onConfirm}>
            Pay ₹{plan.price}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
