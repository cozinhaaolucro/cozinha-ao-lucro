import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

// Eager load critical pages
import Index from "./pages/Index";

// Lazy load Providers to isolate heavy dependencies (Supabase, Auth) from Landing Page
const AppProviders = lazy(() => import("./AppProviders"));
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy load app pages for better performance
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));

const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Pedidos = lazy(() => import("./pages/app/Pedidos"));
const Clientes = lazy(() => import("./pages/app/Clientes"));
const Produtos = lazy(() => import("./pages/app/Produtos"));
const Agenda = lazy(() => import("./pages/app/Agenda"));
const SmartList = lazy(() => import("./pages/app/SmartList"));
const PublicMenu = lazy(() => import("./pages/public/PublicMenu"));
const Aprender = lazy(() => import("./pages/app/Aprender"));
const Settings = lazy(() => import("./pages/app/Settings"));
const PublicMenuConfig = lazy(() => import("./pages/app/PublicMenuConfig"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SystemLogs = lazy(() => import("./pages/admin/SystemLogs"));
import { SystemErrorBoundary } from "./components/SystemErrorBoundary";


// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Toaster />
        <Sonner />
        <SystemErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing Page - NO Auth Provider, NO Database Load */}
                {Capacitor.isNativePlatform() ? (
                  <Route path="/" element={<Navigate to="/login" replace />} />
                ) : (
                  <Route path="/" element={<Index />} />
                )}

                {/* Wrapped Routes - Auth & Notification Providers applied here (Lazy Loaded) */}
                <Route element={<AppProviders />}>
                  {/* Protected App Routes */}
                  <Route path="/app" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="pedidos" element={<Pedidos />} />
                    <Route path="clientes" element={<Clientes />} />
                    <Route path="produtos" element={<Produtos />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="lista-inteligente" element={<SmartList />} />
                    <Route path="aprender" element={<Aprender />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="cardapio-digital" element={<PublicMenuConfig />} />
                    <Route path="perfil" element={<Navigate to="settings" replace />} />
                    {/* Admin Route - Hidden */}
                    <Route path="logs" element={<SystemLogs />} />
                  </Route>

                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/menu/:userId" element={<PublicMenu />} />
                  <Route path="/admin/logs" element={<Navigate to="/app/logs" replace />} /> {/* Shortcut */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SystemErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Simple wrapper removed


export default App;

