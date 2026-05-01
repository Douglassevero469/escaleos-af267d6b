import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  positive?: boolean;
  className?: string;
  info?: string;
}

export function StatsCard({ title, value, icon: Icon, change, positive, className, info }: StatsCardProps) {
  return (
    <GlassCard className={cn("hover-scale cursor-default min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            {info && <InfoTooltip text={info} size={13} />}
          </div>
          <p className="text-xl lg:text-2xl font-bold tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
            {value}
          </p>
          {change && (
            <p className={cn("text-xs font-medium truncate", positive ? "text-success" : "text-destructive")}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </GlassCard>
  );
}
