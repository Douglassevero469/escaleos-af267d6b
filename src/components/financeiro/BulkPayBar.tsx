import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { formatBRL } from "@/lib/finance-utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Props {
  selectedIds: string[];
  selectedTotal: number;
  onClear: () => void;
  onDone: () => void;
}

/** Floating action bar for bulk-marking transactions as paid. */
export function BulkPayBar({ selectedIds, selectedTotal, onClear, onDone }: Props) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  if (selectedIds.length === 0) return null;

  async function markAllPaid() {
    if (
      !(await confirm({
        title: `Marcar ${selectedIds.length} lançamento(s) como pago?`,
        description: `Total: ${formatBRL(selectedTotal)}. A data de pagamento será hoje.`,
        confirmText: "Confirmar",
      }))
    )
      return;

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("bulk_mark_transactions_paid", {
        _ids: selectedIds,
        _paid_date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      toast.success(`${data} lançamento(s) marcados como pagos`);
      qc.invalidateQueries({ queryKey: ["fin-tx-cf"] });
      qc.invalidateQueries({ queryKey: ["fin-tx"] });
      onDone();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao processar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
      <div className="rounded-2xl glass-strong shadow-2xl border border-primary/20 px-4 py-3 flex items-center gap-3 min-w-[360px]">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/15 text-primary text-xs font-bold w-7 h-7 flex items-center justify-center tabular-nums">
            {selectedIds.length}
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground leading-none">selecionados</span>
            <span className="text-sm font-semibold tabular-nums leading-tight">{formatBRL(selectedTotal)}</span>
          </div>
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
        <Button size="sm" onClick={markAllPaid} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Marcar pago
        </Button>
      </div>
    </div>
  );
}
