import { GlassCard } from "@/components/ui/GlassCard";
import { StatsCard } from "@/components/ui/StatsCard";
import {
  Users, Package, FileText, Activity, Shield, ShieldCheck, Search, Coins, Loader2,
  ScrollText, CheckCircle, XCircle, AlertTriangle, Info, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminUserActions } from "@/components/admin/AdminUserActions";

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  total_packages: number;
  total_documents: number;
  total_tokens: number;
  total_words: number;
  modules: string[];
}

interface AdminStats {
  total_users: number;
  total_packages: number;
  total_documents: number;
  total_tokens: number;
  generations_today: number;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  status: string;
  created_at: string;
}

const TOKEN_COST_PER_MILLION_USD = 5;
const USD_TO_BRL = 5.8;

const ACTION_LABELS: Record<string, string> = {
  package_created: "Pacote criado",
  package_status_changed: "Status do pacote alterado",
  document_created: "Documento criado",
  document_generated: "Documento gerado",
  document_failed: "Documento falhou",
  document_generating: "Gerando documento",
  document_status_changed: "Status do documento alterado",
  client_created: "Cliente criado",
  client_updated: "Cliente atualizado",
  client_deleted: "Cliente excluído",
  role_assigned: "Role atribuída",
  role_removed: "Role removida",
  finance_revenue_deleted: "Receita excluída",
  finance_expense_deleted: "Despesa excluída",
  finance_team_deleted: "Membro da equipe excluído",
  finance_goal_deleted: "Meta excluída",
  finance_transaction_deleted: "Lançamento excluído",
};

const STATUS_CONFIG: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
};

const ENTITY_LABELS: Record<string, string> = {
  package: "Pacote",
  document: "Documento",
  client: "Cliente",
  user_role: "Role",
  finance_revenue: "Receita",
  finance_expense: "Despesa",
  finance_team_member: "Equipe",
  finance_goal: "Meta",
  finance_transaction: "Lançamento",
};

const PAGE_SIZE = 50;

export default function Admin() {
  const [search, setSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>("all");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data === true;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_stats");
      if (error) throw error;
      return (data as unknown as AdminStats[])?.[0] ?? null;
    },
    enabled: isAdmin === true,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_users");
      if (error) throw error;
      return (data as unknown as AdminUser[]) ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["admin-audit-logs", auditEntityFilter, auditStatusFilter, auditPage],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_audit_logs", {
        _limit: PAGE_SIZE,
        _offset: auditPage * PAGE_SIZE,
        _entity_type: auditEntityFilter === "all" ? null : auditEntityFilter,
        _status: auditStatusFilter === "all" ? null : auditStatusFilter,
      });
      if (error) throw error;
      return (data as unknown as AuditLog[]) ?? [];
    },
    enabled: isAdmin === true,
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ targetUserId, role }: { targetUserId: string; role: string }) => {
      const { error } = await supabase.rpc("admin_set_user_role", {
        _target_user_id: targetUserId,
        _role: role as "admin" | "user",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      toast({ title: "Papel atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar papel", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(
    (l) =>
      !auditSearch ||
      (l.user_email || "").toLowerCase().includes(auditSearch.toLowerCase()) ||
      (l.user_name || "").toLowerCase().includes(auditSearch.toLowerCase()) ||
      (ACTION_LABELS[l.action] || l.action).toLowerCase().includes(auditSearch.toLowerCase())
  );

  const totalCostBRL = stats
    ? (stats.total_tokens / 1_000_000) * TOKEN_COST_PER_MILLION_USD * USD_TO_BRL
    : 0;

  if (checkingRole) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Shield className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm">Você não tem permissão para acessar o painel admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel Admin</h1>
        <p className="text-sm text-muted-foreground font-light">Gestão global da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Usuários" value={stats?.total_users ?? 0} icon={Users} />
        <StatsCard title="Pacotes" value={stats?.total_packages ?? 0} icon={Package} />
        <StatsCard title="Documentos" value={stats?.total_documents ?? 0} icon={FileText} />
        <StatsCard title="Gerações Hoje" value={stats?.generations_today ?? 0} icon={Activity} />
        <StatsCard title="Custo Total (BRL)" value={`R$ ${totalCostBRL.toFixed(2)}`} icon={Coins} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Log de Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Usuários ({users.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs bg-muted/50 pl-9"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead className="text-right">Pacotes</TableHead>
                      <TableHead className="text-right">Docs</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo (BRL)</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const initials = (u.display_name || u.email || "?")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const userCost = (u.total_tokens / 1_000_000) * TOKEN_COST_PER_MILLION_USD * USD_TO_BRL;

                      return (
                        <TableRow key={u.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{u.display_name || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(val) =>
                                setRoleMutation.mutate({ targetUserId: u.user_id, role: val })
                              }
                              disabled={u.user_id === user?.id}
                            >
                              <SelectTrigger className="w-24 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" /> Admin
                                  </span>
                                </SelectItem>
                                <SelectItem value="user">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" /> User
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{u.total_packages}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{u.total_documents}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm">{u.total_tokens.toLocaleString()}</span>
                            <p className="text-[10px] text-muted-foreground">
                              {u.total_words.toLocaleString()} palavras
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            R$ {userCost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {u.last_sign_in_at
                              ? formatDistanceToNow(new Date(u.last_sign_in_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })
                              : "Nunca"}
                          </TableCell>
                          <TableCell>
                            <AdminUserActions
                              userId={u.user_id}
                              userEmail={u.email}
                              userName={u.display_name}
                              currentModules={u.modules || []}
                              isSelf={u.user_id === user?.id}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <GlassCard>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" />
                Log de Auditoria
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-48 bg-muted/50 pl-9 h-8 text-xs"
                  />
                </div>
                <Select value={auditEntityFilter} onValueChange={(v) => { setAuditEntityFilter(v); setAuditPage(0); }}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="package">Pacotes</SelectItem>
                    <SelectItem value="document">Documentos</SelectItem>
                    <SelectItem value="client">Clientes</SelectItem>
                    <SelectItem value="user_role">Roles</SelectItem>
                    <SelectItem value="finance_revenue">Receitas</SelectItem>
                    <SelectItem value="finance_expense">Despesas</SelectItem>
                    <SelectItem value="finance_team_member">Equipe</SelectItem>
                    <SelectItem value="finance_goal">Metas</SelectItem>
                    <SelectItem value="finance_transaction">Lançamentos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={auditStatusFilter} onValueChange={(v) => { setAuditStatusFilter(v); setAuditPage(0); }}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Data/Hora</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.info;
                        const StatusIcon = sc.icon;

                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {log.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {ACTION_LABELS[log.action] || log.action}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {ENTITY_LABELS[log.entity_type] || log.entity_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div>
                                <span className="font-medium">{log.user_name || "—"}</span>
                                {log.user_email && (
                                  <p className="text-muted-foreground text-[10px]">{log.user_email}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="text-[10px] text-muted-foreground space-y-0.5">
                                  {Object.entries(log.details).map(([k, v]) => (
                                    <div key={k} className="truncate">
                                      <span className="font-medium">{k}:</span>{" "}
                                      <span>{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Página {auditPage + 1} · {filteredLogs.length} registros
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={auditPage === 0}
                      onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-3 w-3" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={auditLogs.length < PAGE_SIZE}
                      onClick={() => setAuditPage((p) => p + 1)}
                    >
                      Próxima <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
