import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Settings, History, Crown, Home, Menu, X, Shield, 
  Package, LayoutDashboard, BarChart3, User, ChevronDown 
} from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Check Admin Status
        if (session.user.email === 'nssoftwaresolutions1@gmail.com') {
            setIsAdmin(true);
        } else {
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
    setIsMenuOpen(false);
  };

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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Invoice Port</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1 items-center">
            
            {isAdmin && (
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin')}
                    className="text-white bg-indigo-800/50 hover:bg-indigo-800 rounded-full border border-indigo-400/30 mr-2"
                >
                    <Shield className="mr-2 h-4 w-4" /> Admin
                </Button>
            )}
            
            <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-indigo-500/50 rounded-full" title="Dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Button>

            <Button variant="ghost" onClick={() => navigate('/inventory')} className="text-white hover:bg-indigo-500/50 rounded-full" title="Product Inventory">
              <Package className="mr-2 h-4 w-4" /> Inventory
            </Button>

            <Button variant="ghost" onClick={() => navigate('/statistics')} className="text-white hover:bg-indigo-500/50 rounded-full" title="Statistics">
              <BarChart3 className="mr-2 h-4 w-4" /> Stats
            </Button>
            
            <Button variant="ghost" onClick={() => navigate('/branding')} className="text-white hover:bg-indigo-500/50 rounded-full" title="Branding Settings">
              <Settings className="mr-2 h-4 w-4" /> Branding
            </Button>

            {/* User Dropdown Menu */}
            <div className="ml-2 pl-2 border-l border-indigo-400/50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-white hover:bg-indigo-500/50 rounded-full pl-2 pr-3 gap-2 h-10">
                            <div className="bg-indigo-800/60 p-1.5 rounded-full">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Account</span>
                            <ChevronDown className="h-3 w-3 opacity-70" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 bg-white rounded-xl shadow-xl border border-gray-100">
                        <DropdownMenuLabel className="text-gray-500 text-xs font-normal uppercase tracking-wider">My Account</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer py-2.5">
                            <User className="mr-2 h-4 w-4 text-indigo-600" /> Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer py-2.5">
                            <Crown className="mr-2 h-4 w-4 text-orange-500" /> Subscription
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/invoice-history')} className="cursor-pointer py-2.5">
                            <History className="mr-2 h-4 w-4 text-blue-600" /> History
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5">
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-indigo-500/50 p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div> 

      {/* Mobile Menu Dropdown (Vertical List) */}
      {isMenuOpen && (
        <div className="md:hidden bg-indigo-700 border-t border-indigo-500/30 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {isAdmin && (
            <Button variant="ghost" onClick={() => handleNavigation('/admin')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left bg-indigo-800/30 mb-2">
                <Shield className="mr-3 h-5 w-5" /> Admin Dashboard
            </Button>
          )}

          <Button variant="ghost" onClick={() => handleNavigation('/')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>

          <Button variant="ghost" onClick={() => handleNavigation('/inventory')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
            <Package className="mr-3 h-5 w-5" /> Inventory
          </Button>

          <Button variant="ghost" onClick={() => handleNavigation('/statistics')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
            <BarChart3 className="mr-3 h-5 w-5" /> Stats
          </Button>
          
          <Button variant="ghost" onClick={() => handleNavigation('/branding')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
            <Settings className="mr-3 h-5 w-5" /> Branding
          </Button>

          <div className="border-t border-indigo-500/30 my-2 pt-2">
              <p className="text-xs text-indigo-300 uppercase tracking-wider mb-2 px-4">Account</p>
              <Button variant="ghost" onClick={() => handleNavigation('/profile')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
                <User className="mr-3 h-5 w-5" /> Profile
              </Button>
              <Button variant="ghost" onClick={() => handleNavigation('/subscription')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
                <Crown className="mr-3 h-5 w-5" /> Subscription
              </Button>
              <Button variant="ghost" onClick={() => handleNavigation('/invoice-history')} className="w-full justify-start text-white hover:bg-indigo-600/50 text-left">
                <History className="mr-3 h-5 w-5" /> History
              </Button>
          </div>
          
          <div className="border-t border-indigo-500/30 my-2"></div>

          <Button onClick={handleLogout} className="w-full justify-start bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md">
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navigation;