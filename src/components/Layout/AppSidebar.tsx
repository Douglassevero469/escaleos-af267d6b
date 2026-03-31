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
import escaleIcon from "@/assets/escale-icon.png";
import escaleLogoWhite from "@/assets/escale-logo-white.png";
import escaleLogoDark from "@/assets/escale-logo-dark.png";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Novo Briefing", url: "/briefing/novo", icon: FilePlus },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Formulários", url: "/forms", icon: ClipboardList },
  { title: "Demandas", url: "/demandas", icon: KanbanSquare },
  { title: "CRM", url: "/crm", icon: Contact },
  { title: "Admin", url: "/admin", icon: Settings },
  { title: "Meu Perfil", url: "/perfil", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const isActive = (path: string) => location.pathname.startsWith(path);

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
              {mainItems.map((item) => (
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
