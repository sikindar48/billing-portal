import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter = () => {
  return (
    <footer className="py-12 border-t border-white/5 bg-[#05080F] relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 text-white">
            <img 
              src="https://twfoqvxlhxhdulqchjbq.supabase.co/storage/v1/object/public/icon/invoice_logo.webp" 
              alt="InvoicePort Logo" 
              className="h-5 w-auto"
            />
            <span className="text-lg font-bold tracking-tight">InvoicePort</span>
          </div>
          
          {/* Footer Navigation & Legal Links */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
              <Link 
                to="/free-invoicing-software" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Free Software
              </Link>
              <span className="text-slate-600">•</span>
              <Link 
                to="/invoicing-software-for-freelancers" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Freelancers
              </Link>
              <span className="text-slate-600">•</span>
              <Link 
                to="/invoicing-software-for-small-business" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Small Business
              </Link>
              <span className="text-slate-600">•</span>
              <Link 
                to="/privacy-policy" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-slate-600">•</span>
              <Link 
                to="/terms-of-service" 
                className="text-slate-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-slate-600 shrink-0">
              © {new Date().getFullYear()} InvoicePort Inc.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
