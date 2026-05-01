import {
  LayoutDashboard,
  FilePlus,
  Users,
  FileText,
  Settings,
  LogOut,
  UserCircle,
  ClipboardList,
  KanbanSquare,
  Contact,
  Phone,
  Briefcase,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useUserModules } from "@/hooks/useUserModules";
import escaleIcon from "@/assets/escale-icon.png";
import escaleLogoWhite from "@/assets/escale-logo-white.png";
import escaleLogoDark from "@/assets/escale-logo-dark.png";

const mainItems = [
  { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "briefing", title: "Novo Briefing", url: "/briefing/novo", icon: FilePlus },
  { key: "clientes", title: "Clientes", url: "/clientes", icon: Users },
  { key: "gestao-clientes", title: "Gestão de Clientes", url: "/gestao-clientes", icon: Briefcase },
  { key: "financeiro", title: "Financeiro", url: "/financeiro", icon: Wallet },
  { key: "templates", title: "Templates", url: "/templates", icon: FileText },
  { key: "forms", title: "Formulários", url: "/forms", icon: ClipboardList },
  { key: "demandas", title: "Demandas", url: "/demandas", icon: KanbanSquare },
  { key: "crm", title: "CRM", url: "/crm", icon: Contact },
  { key: "closer-ai", title: "CloserAI", url: "/closer-ai", icon: Phone },
  { key: "admin", title: "Admin", url: "/admin", icon: Settings },
  { key: "perfil", title: "Meu Perfil", url: "/perfil", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { data: allowedModules } = useUserModules();
  const isActive = (path: string) => location.pathname.startsWith(path);
  const visibleItems = allowedModules
    ? mainItems.filter((i) => allowedModules.includes(i.key))
    : mainItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className={collapsed ? "p-2 flex items-center justify-center" : "p-4"}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} overflow-hidden`}>
          {collapsed ? (
            <img src={escaleIcon} alt="Escale" className="h-7 w-7 rounded-lg flex-shrink-0" />
          ) : (
            <img src={theme === "light" ? escaleLogoDark : escaleLogoWhite} alt="Escale" className="h-6 flex-shrink-0" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 uppercase text-[10px] tracking-widest">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`hover:bg-sidebar-accent transition-colors ${isActive(item.url) ? "bg-primary/10 text-primary font-medium" : ""}`}
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground truncate mb-2 px-1">{user.email}</p>
        )}
        <SidebarMenuButton onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors w-full">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
