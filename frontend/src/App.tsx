import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Dashboard from "@/pages/Dashboard";
import LeadManagement from "@/pages/LeadManagement";
import NewLead from "@/pages/NewLead";
import LeadDetail from "@/pages/LeadDetail";
import LeadAssignment from "@/pages/LeadAssignment";
import Analytics from "@/pages/Analytics";
import AuditLogs from "@/pages/AuditLogs";
import ExportData from "@/pages/ExportData";
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RoleProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/leads" element={<AppLayout><LeadManagement /></AppLayout>} />
              <Route path="/leads/new" element={<AppLayout><NewLead /></AppLayout>} />
              <Route path="/leads/:id" element={<AppLayout><LeadDetail /></AppLayout>} />
              <Route path="/assignments" element={<AppLayout><LeadAssignment /></AppLayout>} />
              <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
              <Route path="/audit" element={<AppLayout><AuditLogs /></AppLayout>} />
              <Route path="/export" element={<AppLayout><ExportData /></AppLayout>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
