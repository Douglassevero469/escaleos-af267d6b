import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stageId: string;
}

export function NewLeadDialog({ open, onOpenChange, pipelineId, stageId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });

  const create = useMutation({
    mutationFn: async () => {
      await supabase.from("crm_leads").insert({
        pipeline_id: pipelineId,
        user_id: user!.id,
        stage: stageId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
      });
    },
    onSuccess: () => {
      toast.success("Lead criado");
      setForm({ name: "", email: "", phone: "", company: "" });
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Nome</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label className="text-xs">Empresa</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
          <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!form.name.trim()}>Criar Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
