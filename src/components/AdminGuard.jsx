import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AdminGuard = ({ children }) => {
  const { isAdmin, authLoading, isAuthResolved } = useAuth();
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState('Connecting to security engine...');

  React.useEffect(() => {
    if (authLoading || !isAuthResolved) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 400);

      const messages = [
        'Connecting to security engine...',
        'Verifying admin credentials...',
        'Checking authorization headers...',
        'Resolving guardrail status...',
        'Securing terminal session...'
      ];
      let i = 0;
      const msgTimer = setInterval(() => {
        i = (i + 1) % messages.length;
        setStatus(messages[i]);
      }, 1500);

      return () => {
        clearInterval(timer);
        clearInterval(msgTimer);
      };
    } else {
      setProgress(100);
    }
  }, [authLoading, isAuthResolved]);
  
  if (authLoading || !isAuthResolved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19]">
        {/* Top Loading Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-[100]">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 relative z-10" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-white font-bold text-lg tracking-tight">Security Handshake</h2>
            <p className="text-gray-500 text-sm font-medium animate-pulse transition-all duration-500">{status}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] p-6 text-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-white/10 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500" />
          
          <div className="mx-auto bg-red-500/10 h-20 w-20 rounded-2xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0 duration-500">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Access Denied</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            This high-security area is restricted to system administrators only. Your current account does not have the required permissions.
          </p>
          
          <div className="space-y-4">
            <Button
              className="w-full bg-white text-black hover:bg-gray-100 h-12 rounded-xl font-semibold transition-all active:scale-[0.98]"
              onClick={() => window.location.href = '/dashboard'}
            >
              Back to Dashboard
            </Button>
            
            <div className="pt-6 border-t border-white/10">
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">Admin Resource</p>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-center gap-2 group cursor-pointer hover:bg-white/10 transition-colors">
                <code className="text-indigo-400 text-xs">http://192.168.2.1:8080/admin</code>
                <span className="text-gray-600 text-xs">— for admin email</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-gray-600 text-sm">
          Protected by InvoicePort Security Engine
        </p>
      </div>
    );
  }

  return children;
};

export default AdminGuard;
