import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const ALL_MODULES: { key: string; label: string; path: string }[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard" },
  { key: "briefing", label: "Novo Briefing", path: "/briefing" },
  { key: "clientes", label: "Clientes", path: "/clientes" },
  { key: "gestao-clientes", label: "Gestão de Clientes", path: "/gestao-clientes" },
  { key: "financeiro", label: "Financeiro", path: "/financeiro" },
  { key: "templates", label: "Templates", path: "/templates" },
  { key: "forms", label: "Formulários", path: "/forms" },
  { key: "demandas", label: "Demandas", path: "/demandas" },
  { key: "crm", label: "CRM", path: "/crm" },
  { key: "closer-ai", label: "CloserAI", path: "/closer-ai" },
  { key: "admin", label: "Admin", path: "/admin" },
  { key: "perfil", label: "Meu Perfil", path: "/perfil" },
];

export function useUserModules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-modules", user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const { data, error } = await supabase.rpc("get_user_modules");
      if (error) {
        console.error("get_user_modules error", error);
        return ALL_MODULES.map((m) => m.key);
      }
      return (data as string[]) ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

/** Determina a key de módulo a partir do pathname */
export function moduleKeyForPath(pathname: string): string | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/briefing")) return "briefing";
  if (pathname.startsWith("/clientes")) return "clientes";
  if (pathname.startsWith("/gestao-clientes")) return "gestao-clientes";
  if (pathname.startsWith("/financeiro")) return "financeiro";
  if (pathname.startsWith("/pacote")) return "clientes";
  if (pathname.startsWith("/templates")) return "templates";
  if (pathname.startsWith("/forms")) return "forms";
  if (pathname.startsWith("/demandas")) return "demandas";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/closer-ai")) return "closer-ai";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/perfil")) return "perfil";
  return null;
}
