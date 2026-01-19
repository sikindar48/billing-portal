import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

// Import components
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index"; // Now the landing page
import Dashboard from "./pages/Dashboard"; // The invoice creation form
import AdminDashboard from "./pages/AdminDashboard";
import BrandingSettings from "./pages/BrandingSettings";
import ConfirmEmail from "./pages/ConfirmEmail";
import GmailCallback from "./pages/GmailCallback";
import OTPVerification from "./pages/OTPVerification";
import InvoiceHistory from "./pages/InvoiceHistory";
import ProductInventory from "./pages/ProductInventory";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import SubscriptionPage from "./pages/SubscriptionPage";
import TemplatePage from "./pages/TemplatePage";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";

const queryClient = new QueryClient();

const App = () => {
  // Handle auth state changes and redirects
  useEffect(() => {
    const handleAuthStateChange = async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
      }
    };

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      return () => subscription?.unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }
  }, []);

  console.log('App component rendering...');

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster 
            position="top-center" 
            duration={2000}
            closeButton={true}
            richColors={true}
          />
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} /> {/* Landing page with auth form */}
            <Route path="/auth" element={<AuthPage />} /> {/* Keep for backward compatibility */}
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/gmail-callback" element={<GmailCallback />} /> {/* Gmail OAuth callback */}
            <Route path="/otp-verification" element={<OTPVerification />} /> {/* OTP verification */}
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Dashboard />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/branding" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <BrandingSettings />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard/settings" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <BrandingSettings />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <ProductInventory />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/statistics" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Statistics />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/invoice-history" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <InvoiceHistory />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/template" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <TemplatePage />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;