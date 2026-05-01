import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  positive?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, change, positive, className }: StatsCardProps) {
  return (
    <GlassCard className={cn("hover-scale cursor-default min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
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
