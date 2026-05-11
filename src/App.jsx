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
import Index from "./pages/public/Index";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const InvoiceHistory = lazy(() => import("./pages/dashboard/InvoiceHistory"));
const ProductInventory = lazy(() => import("./pages/management/ProductInventory"));
const Customers = lazy(() => import("./pages/management/Customers"));
const BrandingSettings = lazy(() => import("./pages/settings/BrandingSettings"));
const Profile = lazy(() => import("./pages/settings/Profile"));
const TemplatePage = lazy(() => import("./pages/dashboard/TemplatePage"));
const SubscriptionPage = lazy(() => import("./pages/subscription/SubscriptionPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
 
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
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                      element={<Navigate to="/admin/users" replace />}
                    />

                    <Route
                      path="/admin/:tab"
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