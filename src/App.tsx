
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import ImportData from "./pages/ImportData";
import Reports from "./pages/Reports";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import { useEffect } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  // Show a notification to connect to Supabase if needed
  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      toast.warning(
        "Supabase connection required",
        {
          description: "Please connect to Supabase using the green button at the top right to enable database features.",
          duration: 10000,
        }
      );
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
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
    </QueryClientProvider>
  );
};

export default App;
