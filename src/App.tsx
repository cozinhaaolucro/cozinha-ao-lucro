import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './lib/supabase';
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Eager load critical pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";

// Lazy load app pages for better performance
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Pedidos = lazy(() => import("./pages/app/Pedidos"));
const Clientes = lazy(() => import("./pages/app/Clientes"));
const Produtos = lazy(() => import("./pages/app/Produtos"));
const Agenda = lazy(() => import("./pages/app/Agenda"));
const Aprender = lazy(() => import("./pages/app/Aprender"));
const Settings = lazy(() => import("./pages/app/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));


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
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>

                // ... inside Routes ...

                  {/* Redirect Native App directly to login */}
                  {Capacitor.isNativePlatform() ? (
                    <Route path="/" element={<Navigate to="/login" replace />} />
                  ) : (
                    <Route path="/" element={<Index />} />
                  )}


                  <Route path="/app" element={<DashboardLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="pedidos" element={<Pedidos />} />
                    <Route path="clientes" element={<Clientes />} />
                    <Route path="produtos" element={<Produtos />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="aprender" element={<Aprender />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="perfil" element={<Navigate to="settings" replace />} />
                  </Route>

                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

