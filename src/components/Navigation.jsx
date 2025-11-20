import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, History, Crown, Home, Menu, X, Shield } from 'lucide-react'; 

const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // 1. Check Hardcoded Admin Email (Fastest)
        if (session.user.email === 'nssoftwaresolutions1@gmail.com') {
            setIsAdmin(true);
        } else {
            // 2. Check Database Role (More robust)
            const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('role', 'admin')
                .maybeSingle();
            
            if (data) setIsAdmin(true);
        }
      }
    };

    checkUser();

    // Subscription for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
        setIsAdmin(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
    setIsMenuOpen(false); // Close menu on logout
  };

  // Helper to close menu when navigating
  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-700 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          
          {/* Logo/App Title */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation('/')}>
            <Home className="h-6 w-6 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">InvoNexus</h1>
          </div>
          
          {/* Desktop Navigation (Hidden on Mobile) */}
          <div className="hidden md:flex gap-2 items-center">
            
            {/* ADMIN BUTTON - Only visible if admin */}
            {isAdmin && (
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin')}
                    className="text-white bg-indigo-800/50 hover:bg-indigo-800 rounded-full border border-indigo-400/30"
                >
                    <Shield className="mr-2 h-4 w-4" /> Admin
                </Button>
            )}

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
            
            <div className="w-px h-6 bg-indigo-400/50 mx-2"></div>

            <Button
              onClick={handleLogout}
              className="bg-red-500 text-white hover:bg-red-600 font-semibold shadow-md transition-all duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button (Visible on Mobile) */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-indigo-500/50 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div> 

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-indigo-700 border-t border-indigo-500/30 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {/* Mobile Admin Link */}
          {isAdmin && (
            <Button
                variant="ghost"
                onClick={() => handleNavigation('/admin')}
                className="w-full justify-start text-white hover:bg-indigo-600/50 text-left bg-indigo-800/30 mb-2"
            >
                <Shield className="mr-3 h-5 w-5" />
                Admin Dashboard
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => handleNavigation('/subscription')}
            className="w-full justify-start text-white hover:bg-indigo-600/50 text-left"
          >
            <Crown className="mr-3 h-5 w-5" />
            Pricing
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleNavigation('/invoice-history')}
            className="w-full justify-start text-white hover:bg-indigo-600/50 text-left"
          >
            <History className="mr-3 h-5 w-5" />
            History
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => handleNavigation('/branding')}
            className="w-full justify-start text-white hover:bg-indigo-600/50 text-left"
          >
            <Settings className="mr-3 h-5 w-5" />
            Branding
          </Button>
          
          <div className="border-t border-indigo-500/30 my-2"></div>

          <Button
            onClick={handleLogout}
            className="w-full justify-start bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navigation;