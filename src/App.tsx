import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Index from "./pages/Index";
import LP2 from "./pages/LP2";
import LP3 from "./pages/LP3";
import LP4 from "./pages/LP4";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NovoBriefing from "./pages/NovoBriefing";
import Clientes from "./pages/Clientes";
import GestaoClientes from "./pages/GestaoClientes";
import Financeiro from "./pages/Financeiro";
import ClientePacotes from "./pages/ClientePacotes";
import PacoteDocumentos from "./pages/PacoteDocumentos";
import Templates from "./pages/Templates";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormPublic from "./pages/FormPublic";
import BriefingPublico from "./pages/BriefingPublico";
import FormSubmissionsPage from "./pages/FormSubmissions";
import Demandas from "./pages/Demandas";
import CRM from "./pages/CRM";
import CloserAI from "./pages/CloserAI";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/Layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <ConfirmProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lp1" element={<Index />} />
              <Route path="/lp2" element={<LP2 />} />
              <Route path="/lp3" element={<LP3 />} />
              <Route path="/lp4" element={<LP4 />} />
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/briefing/novo" element={<NovoBriefing />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/gestao-clientes" element={<GestaoClientes />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/clientes/:id/pacotes" element={<ClientePacotes />} />
                <Route path="/pacote/:id" element={<PacoteDocumentos />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/forms" element={<Forms />} />
                <Route path="/forms/:id" element={<FormBuilder />} />
                <Route path="/forms/:id/respostas" element={<FormSubmissionsPage />} />
                <Route path="/demandas" element={<Demandas />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/closer-ai" element={<CloserAI />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/perfil" element={<Perfil />} />
              </Route>
              <Route path="/f/:slug" element={<FormPublic />} />
              <Route path="/briefing-publico" element={<BriefingPublico />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </ConfirmProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
