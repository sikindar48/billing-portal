import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, History, Crown, Zap, Home, DollarSign } from 'lucide-react'; // Added icons for more descriptive buttons


const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Set up real-time auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        // Automatically navigate to auth page on sign out
        navigate('/auth');
      }
    });

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription
    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener handles navigation to '/auth'
  };

  // Only render navigation bar if the user is authenticated
  if (!user) return null;

  return (
    // Enhanced styling: Sticky, gradient background, strong shadow
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-700 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        
        {/* Logo/App Title */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-bold text-white tracking-wide">Invoice Generator</h1>
        </div>
        
        {/* Navigation Links */}
        <div className="flex gap-2 items-center">
          
          <Button
            variant="ghost"
            onClick={() => navigate('/subscription')}
            className="text-white hover:bg-indigo-500/50 transition-colors duration-200 rounded-full"
            title="Subscription Pricing"
          >
            <Crown className="mr-2 h-4 w-4" />
            Pricing
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate('/invoice-history')}
            className="text-white hover:bg-indigo-500/50 transition-colors duration-200 rounded-full"
            title="Invoice History"
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/branding')}
            className="text-white hover:bg-indigo-500/50 transition-colors duration-200 rounded-full"
            title="Branding Settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            Branding
          </Button>
          
          {/* Separator / Profile Indicator (Optional) */}
          <div className="w-px h-6 bg-indigo-400/50 mx-2 hidden sm:block"></div>

          {/* Logout Button (Distinct style for action) */}
          <Button
            onClick={handleLogout}
            className="bg-red-500 text-white hover:bg-red-600 font-semibold shadow-md transition-all duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div> 
    </nav>
  );
};

export default Navigation;