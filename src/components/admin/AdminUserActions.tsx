import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ALL_MODULES } from "@/hooks/useUserModules";

interface Props {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  currentModules: string[];
  isSelf: boolean;
}

export function AdminUserActions({ userId, userEmail, userName, currentModules, isSelf }: Props) {
  const [pwOpen, setPwOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(currentModules);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (permOpen) setSelectedModules(currentModules);
  }, [permOpen, currentModules]);

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("admin-update-password", {
        body: { target_user_id: userId, new_password: password },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso" });
      setPwOpen(false);
      setPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao alterar senha", description: e.message, variant: "destructive" });
    },
  });

  const modulesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_set_user_modules", {
        _target_user_id: userId,
        _modules: selectedModules,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Permissões atualizadas" });
      setPermOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-modules"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao salvar permissões", description: e.message, variant: "destructive" });
    },
  });

  const handlePasswordSave = () => {
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    passwordMutation.mutate();
  };

  const toggleModule = (key: string) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex items-center gap-1 justify-end">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 gap-1 text-xs"
        onClick={() => setPwOpen(true)}
        title="Alterar senha"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Senha
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 gap-1 text-xs"
        onClick={() => setPermOpen(true)}
        title="Permissões de módulos"
      >
        <Shield className="h-3.5 w-3.5" />
        Permissões
      </Button>

      {/* Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Definir nova senha para <span className="font-medium">{userName || userEmail}</span>.
              O usuário precisará usar a nova senha no próximo login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancelar</Button>
            <Button onClick={handlePasswordSave} disabled={passwordMutation.isPending}>
              {passwordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar nova senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permissões de módulos</DialogTitle>
            <DialogDescription>
              Selecione quais abas <span className="font-medium">{userName || userEmail}</span> pode visualizar e acessar.
              {isSelf && (
                <span className="block mt-1 text-yellow-600 dark:text-yellow-500 text-xs">
                  ⚠️ Você está editando suas próprias permissões.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
            {ALL_MODULES.map((m) => {
              const checked = selectedModules.includes(m.key);
              return (
                <label
                  key={m.key}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleModule(m.key)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.path}</p>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <button
              className="hover:text-foreground"
              onClick={() => setSelectedModules(ALL_MODULES.map((m) => m.key))}
            >
              Selecionar tudo
            </button>
            <button
              className="hover:text-foreground"
              onClick={() => setSelectedModules([])}
            >
              Limpar
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermOpen(false)}>Cancelar</Button>
            <Button onClick={() => modulesMutation.mutate()} disabled={modulesMutation.isPending}>
              {modulesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
