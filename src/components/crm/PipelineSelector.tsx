import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PipelineSelector({ selectedId, onSelect }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: pipelines = [] } = useQuery({
    queryKey: ["crm-pipelines"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_pipelines").select("*").order("created_at");
      return data || [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.from("crm_pipelines").insert({ name, user_id: user!.id }).select().single();
      return data;
    },
    onSuccess: (data) => {
      toast.success("Pipeline criado");
      setOpen(false);
      setName("");
      qc.invalidateQueries({ queryKey: ["crm-pipelines"] });
      if (data) onSelect(data.id);
    },
  });

  // Auto-select first pipeline
  if (pipelines.length > 0 && !selectedId) {
    setTimeout(() => onSelect(pipelines[0].id), 0);
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedId || ""} onValueChange={onSelect}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Selecione um pipeline" />
        </SelectTrigger>
        <SelectContent>
          {pipelines.map((p: any) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pipeline</DialogTitle></DialogHeader>
          <Input placeholder="Nome do pipeline" value={name} onChange={e => setName(e.target.value)} />
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!name.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
