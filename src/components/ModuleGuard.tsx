import { useLocation, Navigate } from "react-router-dom";
import { useUserModules, moduleKeyForPath } from "@/hooks/useUserModules";
import { ShieldOff } from "lucide-react";

export function ModuleGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: modules, isLoading } = useUserModules();
  const key = moduleKeyForPath(location.pathname);

  if (isLoading || !modules) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (key && !modules.includes(key)) {
    // Redireciona para o primeiro módulo permitido, ou tela de bloqueio
    const fallback = modules[0];
    if (fallback && fallback !== key) {
      return <Navigate to={`/${fallback === "dashboard" ? "dashboard" : fallback}`} replace />;
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <ShieldOff className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Acesso bloqueado</h2>
        <p className="text-muted-foreground text-sm">
          Você não tem permissão para acessar este módulo. Fale com o administrador.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
