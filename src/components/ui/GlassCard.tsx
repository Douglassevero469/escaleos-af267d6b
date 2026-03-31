import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass rounded-lg p-6 transition-all duration-300",
        glow && "glow",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
