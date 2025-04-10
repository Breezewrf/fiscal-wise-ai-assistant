
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import ImportData from "./pages/ImportData";
import Reports from "./pages/Reports";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useEffect } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="import" element={<ImportData />} />
                <Route path="reports" element={<Reports />} />
                <Route path="assistant" element={<Assistant />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Settings />} />
                <Route path="voice" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
