export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const monthLabel = (date: Date) =>
  date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const EXPENSE_CATEGORIES = [
  "Folha", "Prolabores", "Sistemas", "Contador", "Sala", "Marketing",
  "Impostos", "Tráfego", "Freelancers", "Outros",
];

export const REVENUE_CATEGORIES = [
  "Tráfego Pago", "Social Media", "Full Service", "Consultoria", "Software", "Avulso",
];

export const COMPENSATION_LABELS: Record<string, string> = {
  salary: "Salário CLT",
  prolabore: "Pró-labore",
  contractor: "PJ / Freelancer",
};

export const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  paused: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  churned: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  inactive: "bg-muted text-muted-foreground border-border",
  vacant: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  paid: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  overdue: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  canceled: "bg-muted text-muted-foreground border-border",
};
