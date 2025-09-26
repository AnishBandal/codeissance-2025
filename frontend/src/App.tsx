import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, RouteGuard } from "@/contexts/AuthContext";
import { OfflineModeProvider } from "@/contexts/OfflineModeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import OfflineFallback from "@/components/OfflineFallback";
import { withOnlineCheck } from "@/hocs/withOnlineCheck";
import LoginForm from "@/components/auth/LoginForm";
import DashboardBase from "@/pages/Dashboard";
import OfflineDashboard from "@/components/dashboard/OfflineDashboard";
import { useOfflineMode } from "@/hooks/useOfflineMode";

// Create an offline-aware Dashboard component
const Dashboard = () => {
  const { isOffline } = useOfflineMode();
  return isOffline ? <OfflineDashboard /> : <DashboardBase />;
};
import LeadManagementBase from "@/pages/LeadManagement";
import NewLeadBase from "@/pages/NewLead";
import LeadDetailBase from "@/pages/LeadDetail";
import LeadAssignmentBase from "@/pages/LeadAssignment";
import AnalyticsBase from "@/pages/Analytics";
import AuditLogsBase from "@/pages/AuditLogs";
import ExportDataBase from "@/pages/ExportData";
import UserManagementBase from "@/pages/UserManagement";

// Create offline-aware versions of components
const LeadManagement = withOnlineCheck(LeadManagementBase, {
  customOfflineProps: {
    title: "Leads Unavailable Offline",
    message: "Lead management requires an internet connection to load and update lead data. You can view cached leads in offline mode.",
    actionText: "Go to Dashboard",
    actionLink: "/dashboard"
  }
});

const NewLead = NewLeadBase; // Already has offline support

const LeadDetail = withOnlineCheck(LeadDetailBase, {
  customOfflineProps: {
    title: "Lead Details Unavailable",
    message: "Lead details require an internet connection to load. Please try again when you're online.",
    actionText: "Go Back",
    actionLink: "/dashboard"
  }
});

const LeadAssignment = withOnlineCheck(LeadAssignmentBase, {
  customOfflineProps: {
    title: "Assignment Unavailable Offline",
    message: "Lead assignment features require an internet connection.",
    actionText: "Go to Dashboard",
    actionLink: "/dashboard"
  }
});

const Analytics = withOnlineCheck(AnalyticsBase, {
  customOfflineProps: {
    title: "Analytics Unavailable Offline",
    message: "Analytics features require an internet connection to load data.",
    actionText: "Go to Dashboard",
    actionLink: "/dashboard"
  }
});

const AuditLogs = withOnlineCheck(AuditLogsBase, {
  customOfflineProps: {
    title: "Audit Logs Unavailable Offline",
    message: "Audit logs require an internet connection to load data.",
    actionText: "Go to Dashboard",
    actionLink: "/dashboard"
  }
});

const ExportData = withOnlineCheck(ExportDataBase, {
  customOfflineProps: {
    title: "Export Unavailable Offline",
    message: "Data export features require an internet connection.",
    actionText: "Go to Dashboard",
    actionLink: "/dashboard"
  }
});

const UserManagement = withOnlineCheck(UserManagementBase, {
  customOfflineProps: {
    title: "User Management Unavailable Offline",
    message: "User management features require an internet connection.",
    actionText: "Go to Dashboard",
    actionLink: "/dashboard"
  }
});
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
      <OfflineIndicator />
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
          <OfflineModeProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthenticatedApp />
              </BrowserRouter>
            </AuthProvider>
          </OfflineModeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
