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
    <GlassCard className={cn("hover-scale cursor-default", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <p className={cn("text-xs font-medium", positive ? "text-success" : "text-destructive")}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </GlassCard>
  );
}
