import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, RouteGuard } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/pages/Dashboard";
import LeadManagement from "@/pages/LeadManagement";
import NewLead from "@/pages/NewLead";
import LeadDetail from "@/pages/LeadDetail";
import LeadAssignment from "@/pages/LeadAssignment";
import Analytics from "@/pages/Analytics";
import AuditLogs from "@/pages/AuditLogs";
import ExportData from "@/pages/ExportData";
import UserManagement from "@/pages/UserManagement";
import NotFound from "./pages/NotFound";
import { useEffect } from 'react';

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Role-based dashboard routing
  const getDashboardRoute = () => {
    switch (role) {
      case 'authority':
        return '/admin/dashboard';
      case 'nodal':
        return '/nodal/dashboard';
      case 'processing':
        return '/staff/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Navigate to={getDashboardRoute()} replace />} />
      
      {/* Dashboard routes */}
      <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
      <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/admin/dashboard" element={
        <RouteGuard requiredRole="authority">
          <AppLayout><Dashboard /></AppLayout>
        </RouteGuard>
      } />
      <Route path="/nodal/dashboard" element={
        <RouteGuard requiredRole={['authority', 'nodal']}>
          <AppLayout><Dashboard /></AppLayout>
        </RouteGuard>
      } />
      <Route path="/staff/dashboard" element={
        <RouteGuard requiredRole={['authority', 'nodal', 'processing']}>
          <AppLayout><Dashboard /></AppLayout>
        </RouteGuard>
      } />

      {/* Lead management routes */}
      <Route path="/leads" element={
        <RouteGuard requiredRole={['authority', 'nodal', 'processing']}>
          <AppLayout><LeadManagement /></AppLayout>
        </RouteGuard>
      } />
      <Route path="/leads/new" element={
        <RouteGuard requiredRole={['authority', 'nodal', 'processing']}>
          <AppLayout><NewLead /></AppLayout>
        </RouteGuard>
      } />
      <Route path="/leads/:id" element={
        <RouteGuard requiredRole={['authority', 'nodal', 'processing']}>
          <AppLayout><LeadDetail /></AppLayout>
        </RouteGuard>
      } />

      {/* Assignment routes (Nodal Officer and above) */}
      <Route path="/assignments" element={
        <RouteGuard requiredRole={['authority', 'nodal']}>
          <AppLayout><LeadAssignment /></AppLayout>
        </RouteGuard>
      } />

      {/* Analytics routes (Nodal Officer and above) */}
      <Route path="/analytics" element={
        <RouteGuard requiredRole={['authority', 'nodal']}>
          <AppLayout><Analytics /></AppLayout>
        </RouteGuard>
      } />

      {/* Audit logs (Higher Authority only) */}
      <Route path="/audit" element={
        <RouteGuard requiredRole="authority">
          <AppLayout><AuditLogs /></AppLayout>
        </RouteGuard>
      } />

      {/* Export data (Nodal Officer and above) */}
      <Route path="/export" element={
        <RouteGuard requiredRole={['authority', 'nodal']}>
          <AppLayout><ExportData /></AppLayout>
        </RouteGuard>
      } />

      {/* User Management (Nodal Officer and above) */}
      <Route path="/users" element={
        <RouteGuard requiredRole={['authority', 'nodal']}>
          <AppLayout><UserManagement /></AppLayout>
        </RouteGuard>
      } />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthenticatedApp />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
