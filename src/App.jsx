import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

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
import Customers from "./pages/Customers";
import Profile from "./pages/Profile";
import SubscriptionPage from "./pages/SubscriptionPage";
import TemplatePage from "./pages/TemplatePage";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";
import InvoiceVerify from "./pages/InvoiceVerify";
import AdminVerifyPayment from "./pages/AdminVerifyPayment";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";
import AdminGuard from "./components/AdminGuard";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => {
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
            <AuthProvider>
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} /> {/* Landing page with auth form */}
            <Route path="/auth" element={<AuthPage />} /> {/* Keep for backward compatibility */}
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/gmail-callback" element={<GmailCallback />} /> {/* Gmail OAuth callback */}
            <Route path="/otp-verification" element={<OTPVerification />} /> {/* OTP verification */}
            <Route path="/verify-invoice" element={<InvoiceVerify />} /> {/* Public invoice verification */}
            
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
              path="/admin/verify-payment" 
              element={
                <ProtectedRoute>
                  <AdminVerifyPayment />
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
              path="/customers" 
              element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Customers />
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
            
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <Analytics />
                  </AdminGuard>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/audit-logs" 
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;