import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Required<ConfirmOptions>>({
    title: "Tem certeza?",
    description: "Esta ação não poderá ser desfeita.",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    variant: "destructive",
  });
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts({
      title: options?.title ?? "Tem certeza?",
      description: options?.description ?? "Esta ação não poderá ser desfeita.",
      confirmText: options?.confirmText ?? "Confirmar",
      cancelText: options?.cancelText ?? "Cancelar",
      variant: options?.variant ?? "destructive",
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handle = (value: boolean) => {
    setOpen(false);
    resolver?.(value);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => !o && handle(false)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center shrink-0",
                  opts.variant === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2 flex-1 min-w-0 pt-0.5">
                <AlertDialogTitle className="text-base font-medium">{opts.title}</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  {opts.description}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel onClick={() => handle(false)}>{opts.cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handle(true)}
              className={cn(
                opts.variant === "destructive" &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {opts.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
