import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";

// Always-loaded (small, needed immediately)
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard";
import AdminGuard from "./components/AdminGuard";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";

// Pages imported directly for instant tab switching (no lazy-load delay)
import Index from "./pages/public/Index";
import Dashboard from "./pages/dashboard/Dashboard";
import InvoiceHistory from "./pages/dashboard/InvoiceHistory";
import ProductInventory from "./pages/management/ProductInventory";
import Customers from "./pages/management/Customers";
import BrandingSettings from "./pages/settings/BrandingSettings";
import Profile from "./pages/settings/Profile";
import TemplatePage from "./pages/dashboard/TemplatePage";
import SubscriptionPage from "./pages/subscription/SubscriptionPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Analytics from "./pages/admin/Analytics";
 
// Lazy-loaded pages — these are less frequent or large chunks
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const ConfirmEmail = lazy(() => import("./pages/auth/ConfirmEmail"));
const OTPVerification = lazy(() => import("./pages/auth/OTPVerification"));
const GmailCallback = lazy(() => import("./pages/public/GmailCallbackNew"));
const InvoiceVerify = lazy(() => import("./pages/public/InvoiceVerify"));
const PrivacyPolicy = lazy(() => import("./pages/public/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/public/TermsOfService"));
const NotFound = lazy(() => import("./pages/public/NotFound"));
const UserAnalytics = lazy(() => import("./pages/dashboard/UserAnalytics"));
const AdminVerifyPayment = lazy(() => import("./pages/admin/AdminVerifyPayment"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      cacheTime: 1000 * 60 * 10, // 10 minutes - cache persists
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Only retry once on failure
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});

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
    <ErrorBoundary>
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
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  </div>
                }>
                  <Routes>
                    {/* Public Routes - No Navigation */}
                    <Route path="/" element={<Index />} /> {/* Landing page with auth form */}
                    <Route path="/auth" element={<AuthPage />} /> {/* Keep for backward compatibility */}
                    <Route path="/confirm-email" element={<ConfirmEmail />} />
                    <Route path="/gmail-callback" element={<GmailCallback />} /> {/* Gmail OAuth callback */}
                    <Route path="/otp-verification" element={<OTPVerification />} /> {/* OTP verification */}
                    <Route path="/verify-invoice" element={<InvoiceVerify />} /> {/* Public invoice verification */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} /> {/* Privacy Policy */}
                    <Route path="/terms-of-service" element={<TermsOfService />} /> {/* Terms of Service */}

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
                            <AdminGuard>
                              <AdminDashboard />
                            </AdminGuard>
                          </ProtectedRoute>
                        </ProtectedLayout>
                      }
                    />

                    <Route
                      path="/admin/verify-payment"
                      element={
                        <ProtectedLayout>
                          <ProtectedRoute>
                            <AdminGuard>
                              <AdminVerifyPayment />
                            </AdminGuard>
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
                      path="/dashboard/analytics"
                      element={
                        <ProtectedLayout>
                          <ProtectedRoute>
                            <SubscriptionGuard>
                              <UserAnalytics />
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
                            <AdminGuard>
                              <AuditLogs />
                            </AdminGuard>
                          </ProtectedRoute>
                        </ProtectedLayout>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;