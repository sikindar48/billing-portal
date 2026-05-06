import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

// Import components
import AuthPage from "./pages/auth/AuthPage";
import Index from "./pages/public/Index"; // Now the landing page
import Dashboard from "./pages/dashboard/Dashboard"; // The invoice creation form
import AdminDashboard from "./pages/admin/AdminDashboard";
import BrandingSettings from "./pages/settings/BrandingSettings";
import ConfirmEmail from "./pages/auth/ConfirmEmail";
import GmailCallback from "./pages/public/GmailCallback";
import OTPVerification from "./pages/auth/OTPVerification";
import InvoiceHistory from "./pages/dashboard/InvoiceHistory";
import ProductInventory from "./pages/management/ProductInventory";
import Customers from "./pages/management/Customers";
import Profile from "./pages/settings/Profile";
import SubscriptionPage from "./pages/subscription/SubscriptionPage";
import TemplatePage from "./pages/dashboard/TemplatePage";
import Analytics from "./pages/admin/Analytics";
import AuditLogs from "./pages/admin/AuditLogs";
import InvoiceVerify from "./pages/public/InvoiceVerify";
import AdminVerifyPayment from "./pages/admin/AdminVerifyPayment";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";
import AdminGuard from "./components/AdminGuard";
import Navigation from "./components/Navigation";
import AppLoader from "./components/AppLoader";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

// Wrapper component to include Navigation with protected routes
const ProtectedLayout = ({ children }) => {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};

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
              <AppLoader>
                <Routes>
            {/* Public Routes - No Navigation */}
            <Route path="/" element={<Index />} /> {/* Landing page with auth form */}
            <Route path="/auth" element={<AuthPage />} /> {/* Keep for backward compatibility */}
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/gmail-callback" element={<GmailCallback />} /> {/* Gmail OAuth callback */}
            <Route path="/otp-verification" element={<OTPVerification />} /> {/* OTP verification */}
            <Route path="/verify-invoice" element={<InvoiceVerify />} /> {/* Public invoice verification */}
            
            {/* Protected Routes - With Navigation */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <Dashboard />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/admin/verify-payment" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <AdminVerifyPayment />
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/branding" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <BrandingSettings />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/dashboard/settings" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <BrandingSettings />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/inventory" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <ProductInventory />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/customers" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <Customers />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/subscription" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionPage />
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/invoice-history" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <InvoiceHistory />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/template" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TemplatePage />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <AdminGuard>
                      <Analytics />
                    </AdminGuard>
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/audit-logs" 
              element={
                <ProtectedLayout>
                  <ProtectedRoute>
                    <AuditLogs />
                  </ProtectedRoute>
                </ProtectedLayout>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </AppLoader>
            </AuthProvider>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;