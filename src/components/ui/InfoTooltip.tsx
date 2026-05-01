import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  text: string;
  className?: string;
  size?: number;
}

export function InfoTooltip({ text, className, size = 14 }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Mais informações"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors h-5 w-5 shrink-0",
              className
            )}
            onClick={(e) => e.preventDefault()}
          >
            <Info style={{ width: size, height: size }} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="end"
          className="max-w-xs text-xs leading-relaxed bg-popover text-popover-foreground border border-border shadow-lg"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
