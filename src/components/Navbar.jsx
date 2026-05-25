import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center backdrop-blur-sm bg-transparent">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-white hover:opacity-95 transition-opacity">
        <img 
          src="https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp" 
          alt="InvoicePort Logo" 
          className="h-10 w-auto"
        />
        <span className="text-xl font-bold tracking-tight">InvoicePort</span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`transition-colors duration-200 ${
              isActive(item.path) 
                ? 'text-white font-semibold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
        {user ? (
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 rounded-xl"
          >
            Dashboard
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            variant="ghost"
            className="text-white hover:bg-white/10 px-5 rounded-xl border border-white/10"
          >
            Sign In
          </Button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-slate-400 hover:text-white transition-colors"
        aria-label="Toggle Menu"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-6 right-6 p-6 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col gap-4 z-50 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base py-2 border-b border-white/5 transition-colors ${
                isActive(item.path) 
                  ? 'text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
          {user ? (
            <Button 
              onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold w-full rounded-xl py-5 mt-2"
            >
              Dashboard
            </Button>
          ) : (
            <Button 
              onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
              variant="ghost"
              className="text-white hover:bg-white/10 w-full rounded-xl py-5 mt-2 border border-white/10"
            >
              Sign In
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
