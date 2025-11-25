import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/app/Dashboard";
import Pedidos from "./pages/app/Pedidos";
import Clientes from "./pages/app/Clientes";
import Produtos from "./pages/app/Produtos";
import Agenda from "./pages/app/Agenda";
import Aprender from "./pages/app/Aprender";
import Perfil from "./pages/app/Perfil";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/app" element={<DashboardLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="aprender" element={<Aprender />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
