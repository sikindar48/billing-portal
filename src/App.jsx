import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";

// Pages
import TemplatePage from "./pages/TemplatePage";
// import ReceiptPage from "./pages/ReceiptPage"; // Removed based on previous request
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import BrandingSettings from "./pages/BrandingSettings";
import InvoiceHistory from "./pages/InvoiceHistory";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminDashboard from "./pages/AdminDashboard"; // Added Admin Page

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionGuard from "./components/SubscriptionGuard"; // Added Guard
import AdminGuard from "./components/AdminGuard"; // Added Guard

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
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

          {/* --- ADMIN ROUTE (Protected by AdminGuard) --- */}
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

          {/* --- SETTINGS & UTILITY (Accessible even if expired) --- */}
          <Route path="/branding" element={<ProtectedRoute><BrandingSettings /></ProtectedRoute>} />
          <Route path="/invoice-history" element={<ProtectedRoute><InvoiceHistory /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          
          {/* Dynamic Routes from navItems */}
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={<ProtectedRoute>{page}</ProtectedRoute>} />
          ))}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;