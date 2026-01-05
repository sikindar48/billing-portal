import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import TemplatePage from "./pages/TemplatePage";
import BrandingSettings from "./pages/BrandingSettings";
import InvoiceHistory from "./pages/InvoiceHistory";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProductInventory from "./pages/ProductInventory"; 
import Statistics from "./pages/Statistics"; 
import Profile from "./pages/Profile";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";
import AdminGuard from "./components/AdminGuard";

// Navigation Items (Optional fallback)
import { navItems } from "./nav-items"; 

const queryClient = new QueryClient();

const App = () => {
  // Handle auth state changes and redirects
  useEffect(() => {
    const handleAuthStateChange = async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        // Redirect will be handled by ProtectedRoute
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription?.unsubscribe();
  }, []);

  return (
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
          {/* --- Public Routes --- */}
          <Route path="/auth" element={<AuthPage />} />

          {/* --- CORE FEATURES (Require Active Subscription) --- */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Index />
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

          {/* --- ADMIN ROUTE --- */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              </ProtectedRoute>
            } 
          />

          {/* --- SETTINGS & UTILITY (Accessible to all logged-in users) --- */}
          <Route path="/inventory" element={<ProtectedRoute><ProductInventory /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          <Route path="/branding" element={<ProtectedRoute><BrandingSettings /></ProtectedRoute>} />
          <Route path="/invoice-history" element={<ProtectedRoute><InvoiceHistory /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Dynamic Routes from navItems */}
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={<ProtectedRoute>{page}</ProtectedRoute>} />
          ))}

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;