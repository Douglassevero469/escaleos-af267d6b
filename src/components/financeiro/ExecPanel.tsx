import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Painel executivo padrão do módulo Financeiro — visual "Executive Glass Console".
 * Estrutura: [tag uppercase + título + subtítulo] | [KPIs em colunas divididas] | [ações]
 * Usa apenas tokens semânticos para suportar light/dark mode.
 */

interface ExecKpi {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  positive?: boolean;
  badge?: { label: string; positive?: boolean };
}

interface ExecHeaderProps {
  tag: string;
  title: ReactNode;
  subtitle?: ReactNode;
  kpis?: ExecKpi[];
  actions?: ReactNode;
  className?: string;
}

export function ExecHeader({ tag, title, subtitle, kpis, actions, className }: ExecHeaderProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl glass-strong overflow-hidden shadow-[0_8px_32px_hsl(240_20%_4%/0.08)]",
        className
      )}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Top row: title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 lg:p-6 border-b border-border/50">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {tag}
          </span>
          <h2 className="text-lg lg:text-xl font-display font-medium tracking-tight text-foreground leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* KPIs row — full width grid */}
      {kpis && kpis.length > 0 && (
        <div
          className={cn(
            "grid divide-y sm:divide-y-0 sm:divide-x divide-border/50",
            kpis.length === 2 && "grid-cols-1 sm:grid-cols-2",
            kpis.length === 3 && "grid-cols-1 sm:grid-cols-3",
            kpis.length === 4 && "grid-cols-2 lg:grid-cols-4",
            kpis.length >= 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          )}
        >
          {kpis.map((k, i) => (
            <div
              key={i}
              className={cn(
                "min-w-0 p-4 lg:p-5 flex flex-col gap-2 transition-colors hover:bg-foreground/[0.02]",
                k.highlight && "bg-gradient-to-b from-primary/5 to-transparent"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.15em] truncate",
                  k.highlight ? "text-primary" : "text-muted-foreground"
                )}
              >
                {k.label}
              </span>
              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span
                  className={cn(
                    "text-xl lg:text-2xl font-light tabular-nums tracking-tight",
                    k.highlight && (k.positive === false ? "text-destructive font-medium" : "text-foreground font-medium"),
                    !k.highlight && k.positive === false && "text-destructive",
                    !k.highlight && k.positive === true && "text-foreground"
                  )}
                >
                  {k.value}
                </span>
                {k.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded shrink-0",
                      k.badge.positive
                        ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {k.badge.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Card de seção interno padronizado (mesma linguagem visual do ExecHeader,
 * mas mais leve para usar em listas, gráficos e tabelas).
 */
interface ExecCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}

export function ExecCard({
  title,
  subtitle,
  actions,
  padded = true,
  className,
  children,
  ...rest
}: ExecCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl glass-strong overflow-hidden shadow-[0_4px_20px_hsl(240_20%_4%/0.06)]",
        className
      )}
      {...rest}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 lg:px-6 pt-5 lg:pt-6 pb-3">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm lg:text-base font-medium text-foreground leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn(padded && "px-5 lg:px-6 pb-5 lg:pb-6", !title && padded && "pt-5 lg:pt-6")}>
        {children}
      </div>
    </div>
  );
}
