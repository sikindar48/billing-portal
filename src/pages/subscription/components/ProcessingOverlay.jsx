import React from 'react';
import { Loader2 } from 'lucide-react';

const ProcessingOverlay = ({ onDismiss }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4 max-w-sm mx-4 border border-gray-100">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
      <h3 className="text-lg font-semibold text-gray-900">Activating Your Plan</h3>
      <p className="text-sm text-gray-500">Verifying payment and upgrading your account…</p>
      <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
        Taking too long? Dismiss
      </button>
    </div>
  </div>
);

export default ProcessingOverlay;
