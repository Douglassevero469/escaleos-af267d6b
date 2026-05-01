import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Period } from "./PeriodFilter";
import { ExecHeader, ExecCard } from "./ExecPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Target, Trash2, Pencil, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

type GoalType = "revenue" | "expense" | "profit";
type PeriodType = "monthly" | "quarterly" | "yearly";

interface Goal {
  id: string;
  title: string;
  goal_type: GoalType;
  period_type: PeriodType;
  reference_month: string; // YYYY-MM
  target_amount: number;
  notes: string;
  color: string;
}

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
};

const todayMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const goalTypeMeta: Record<GoalType, { label: string; icon: typeof Target; color: string }> = {
  revenue: { label: "Receita", icon: TrendingUp, color: "hsl(var(--success))" },
  expense: { label: "Despesa", icon: TrendingDown, color: "hsl(var(--destructive))" },
  profit: { label: "Lucro", icon: Wallet, color: "hsl(var(--primary))" },
};

const periodTypeLabel: Record<PeriodType, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

interface Props {
  period: Period;
}

export function FinanceGoals({ period }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const confirm = useConfirm();
  const [tx, setTx] = useState<{ kind: string; amount: number; due_date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const emptyForm: Goal = {
    id: "",
    title: "",
    goal_type: "revenue",
    period_type: "monthly",
    reference_month: todayMonth(),
    target_amount: 0,
    notes: "",
    color: "#7B2FF7",
  };
  const [form, setForm] = useState<Goal>(emptyForm);

  const load = async () => {
    setLoading(true);
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase.from("finance_goals").select("*").order("reference_month", { ascending: false }),
      supabase.from("finance_transactions").select("kind,amount,due_date"),
    ]);
    setGoals((g as any) || []);
    setTx((t as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, reference_month: todayMonth() });
    setOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm(g);
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Informe um título para a meta");
      return;
    }
    if (form.target_amount <= 0) {
      toast.error("Valor da meta deve ser maior que zero");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    const payload = {
      title: form.title,
      goal_type: form.goal_type,
      period_type: form.period_type,
      reference_month: form.reference_month,
      target_amount: form.target_amount,
      notes: form.notes,
      color: form.color,
      user_id: u.user.id,
    };

    if (editing) {
      const { error } = await supabase.from("finance_goals").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Meta atualizada");
    } else {
      const { error } = await supabase.from("finance_goals").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Meta criada");
    }
    setOpen(false);
    load();
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm("Excluir esta meta?")) return;
    const { error } = await supabase.from("finance_goals").delete().eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Meta excluída");
    setOpen(false);
    load();
  };

  // Compute progress for each goal based on its reference period and tx
  const computeProgress = (g: Goal): number => {
    const [y, m] = g.reference_month.split("-").map(Number);
    let start = new Date(y, m - 1, 1);
    let end = new Date(y, m, 0, 23, 59, 59);
    if (g.period_type === "quarterly") {
      const qStart = Math.floor((m - 1) / 3) * 3;
      start = new Date(y, qStart, 1);
      end = new Date(y, qStart + 3, 0, 23, 59, 59);
    } else if (g.period_type === "yearly") {
      start = new Date(y, 0, 1);
      end = new Date(y, 12, 0, 23, 59, 59);
    }

    const inRange = tx.filter((t) => {
      const d = new Date(t.due_date);
      return d >= start && d <= end;
    });
    const totalRev = inRange.filter((t) => t.kind === "revenue").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExp = inRange.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);

    if (g.goal_type === "revenue") return totalRev;
    if (g.goal_type === "expense") return totalExp;
    return totalRev - totalExp;
  };

  const enriched = useMemo(
    () =>
      goals.map((g) => {
        const current = computeProgress(g);
        const pct = g.target_amount > 0 ? Math.min(100, Math.max(0, (current / g.target_amount) * 100)) : 0;
        return { ...g, current, pct };
      }),
    [goals, tx]
  );

  const summary = useMemo(() => {
    const total = enriched.length;
    const onTrack = enriched.filter((g) => g.pct >= 70).length;
    const completed = enriched.filter((g) => g.pct >= 100).length;
    const totalTarget = enriched.reduce((s, g) => s + Number(g.target_amount || 0), 0);
    return { total, onTrack, completed, totalTarget };
  }, [enriched]);

  return (
    <div className="space-y-6">
      <ExecHeader
        tag="Metas Financeiras"
        title="Acompanhamento de Objetivos"
        subtitle="Defina metas de receita, despesa e lucro e acompanhe o progresso em tempo real."
        kpis={[
          { label: "Metas ativas", value: summary.total, highlight: true },
          { label: "No prazo (≥70%)", value: summary.onTrack, positive: true },
          { label: "Concluídas", value: summary.completed, positive: true },
          { label: "Valor alvo total", value: formatBRL(summary.totalTarget) },
        ]}
        actions={
          <Button onClick={openNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        }
      />

      {loading ? (
        <ExecCard>
          <p className="text-sm text-muted-foreground text-center py-12">Carregando metas...</p>
        </ExecCard>
      ) : enriched.length === 0 ? (
        <ExecCard>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada ainda</p>
            <Button onClick={openNew} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar primeira meta
            </Button>
          </div>
        </ExecCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enriched.map((g) => {
            const meta = goalTypeMeta[g.goal_type];
            const Icon = meta.icon;
            const exceeded = g.goal_type === "expense" ? g.pct >= 100 : false;
            const achieved = g.goal_type !== "expense" ? g.pct >= 100 : false;

            return (
              <div
                key={g.id}
                className="group relative rounded-2xl glass-strong overflow-hidden shadow-[0_4px_20px_hsl(240_20%_4%/0.06)] hover:shadow-[0_8px_28px_hsl(240_20%_4%/0.10)] transition-all"
              >
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{ background: `linear-gradient(to right, transparent, ${meta.color}, transparent)` }}
                />
                <div className="p-5 lg:p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${meta.color}15`, color: meta.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-foreground truncate">{g.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">•</span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            {periodTypeLabel[g.period_type]}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">•</span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            {monthLabel(g.reference_month)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEdit(g)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Values */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl lg:text-3xl font-light tabular-nums tracking-tight text-foreground">
                        {formatBRL(g.current)}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        de {formatBRL(g.target_amount)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-foreground/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${g.pct}%`,
                          background: exceeded
                            ? "hsl(var(--destructive))"
                            : achieved
                            ? "hsl(var(--success))"
                            : `linear-gradient(to right, ${meta.color}, ${meta.color}dd)`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          exceeded
                            ? "text-destructive"
                            : achieved
                            ? "text-[hsl(var(--success))]"
                            : "text-foreground"
                        )}
                      >
                        {g.pct.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {g.goal_type === "expense"
                          ? exceeded
                            ? `Excedeu em ${formatBRL(g.current - g.target_amount)}`
                            : `Restam ${formatBRL(g.target_amount - g.current)}`
                          : achieved
                          ? `Superou em ${formatBRL(g.current - g.target_amount)}`
                          : `Faltam ${formatBRL(g.target_amount - g.current)}`}
                      </span>
                    </div>
                  </div>

                  {g.notes && (
                    <p className="text-xs text-muted-foreground border-t border-border/50 pt-3 line-clamp-2">
                      {g.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar Meta" : "Nova Meta"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Receita Q1 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.goal_type}
                  onValueChange={(v) => setForm({ ...form, goal_type: v as GoalType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="expense">Despesa (teto)</SelectItem>
                    <SelectItem value="profit">Lucro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select
                  value={form.period_type}
                  onValueChange={(v) => setForm({ ...form, period_type: v as PeriodType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mês de referência</Label>
                <Input
                  type="month"
                  value={form.reference_month}
                  onChange={(e) => setForm({ ...form, reference_month: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Detalhes da meta, premissas, contexto..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editing && (
                <Button variant="outline" onClick={remove} className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              )}
              <Button onClick={save} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
