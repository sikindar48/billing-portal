import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse">
            404
          </h1>
        </div>

        {/* Icon with glow effect */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-indigo-500/30">
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-slate-300 mb-10 max-w-md mx-auto leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons - Enhanced */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/">
            <Button className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Go to Homepage
            </Button>
          </Link>
          
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="group relative border-2 border-slate-600 bg-slate-800/50 backdrop-blur-sm text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-700/50 px-8 py-6 text-base font-semibold transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links - Enhanced */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <p className="text-slate-400 mb-6 text-sm font-medium uppercase tracking-wider">
            Quick Links
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              to="/dashboard" 
              className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 hover:underline underline-offset-4"
            >
              Dashboard
            </Link>
            <span className="text-slate-700">•</span>
            <Link 
              to="/subscription" 
              className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 hover:underline underline-offset-4"
            >
              Pricing
            </Link>
            <span className="text-slate-700">•</span>
            <Link 
              to="/privacy-policy" 
              className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-700">•</span>
            <Link 
              to="/terms-of-service" 
              className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Contact - Enhanced */}
        <div className="mt-8 p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <p className="text-slate-400 text-sm font-medium">
              Need Help?
            </p>
          </div>
          <a 
            href="mailto:info.invoiceport@gmail.com" 
            className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-medium hover:underline underline-offset-4"
          >
            info.invoiceport@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
