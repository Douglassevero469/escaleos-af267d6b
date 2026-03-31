import { GlassCard } from "@/components/ui/GlassCard";
import { StatsCard } from "@/components/ui/StatsCard";
import { Users, Package, FileText, Activity, Shield, ShieldCheck, Search, Coins, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

interface AdminStats {
  total_users: number;
  total_packages: number;
  total_documents: number;
  total_tokens: number;
  generations_today: number;
}

// Gemini 2.5 Pro pricing: $1.25/1M input + $10/1M output tokens ≈ avg ~$5/1M
const TOKEN_COST_PER_MILLION_USD = 5;
const USD_TO_BRL = 5.8;

export default function Admin() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data === true;
    },
    enabled: !!user,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_stats");
      if (error) throw error;
      return (data as unknown as AdminStats[])?.[0] ?? null;
    },
    enabled: isAdmin === true,
  });

  // Fetch all users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_users");
      if (error) throw error;
      return (data as unknown as AdminUser[]) ?? [];
    },
    enabled: isAdmin === true,
  });

  // Set role mutation
  const setRoleMutation = useMutation({
    mutationFn: async ({ targetUserId, role }: { targetUserId: string; role: string }) => {
      const { error } = await supabase.rpc("admin_set_user_role", {
        _target_user_id: targetUserId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Papel atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar papel", variant: "destructive" });
    },
  });

  const filtered = users.filter(
    (u) =>
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalCostBRL = stats
    ? ((stats.total_tokens / 1_000_000) * TOKEN_COST_PER_MILLION_USD * USD_TO_BRL)
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
        <StatsCard
          title="Custo Total (BRL)"
          value={`R$ ${totalCostBRL.toFixed(2)}`}
          icon={Coins}
        />
      </div>

      {/* Users Table */}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
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
                        <p className="text-[10px] text-muted-foreground">{u.total_words.toLocaleString()} palavras</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        R$ {userCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {u.last_sign_in_at
                          ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true, locale: ptBR })
                          : "Nunca"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
