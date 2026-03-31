import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { Mail, Lock, ArrowUpRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import escaleLogoWhite from "@/assets/escale-logo-white.png";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="flex items-center justify-center mb-10">
          <img src={escaleLogoWhite} alt="Escale" className="h-8" />
        </div>

        <GlassCard glow className="p-8 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <h2 className="font-display text-2xl font-bold text-center mb-1">
            {isRegister ? "Criar Conta" : "Bem-vindo de volta"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8">
            {isRegister ? "Preencha seus dados para começar" : "Entre na sua conta para continuar"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label className="text-sm">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="pl-9 bg-muted/50 border-border/60" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-9 bg-muted/50 border-border/60" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 bg-muted/50 border-border/60" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 btn-primary-glow h-11 font-semibold" disabled={loading}>
              {loading ? "Carregando..." : isRegister ? "Criar Conta" : "Entrar"} <ArrowUpRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              {isRegister ? "Já tem conta?" : "Não tem conta?"}
            </span>{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-medium hover:underline">
              {isRegister ? "Entrar" : "Criar conta"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
