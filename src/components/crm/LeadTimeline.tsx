import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ArrowRightLeft, Phone, Mail, Calendar, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<string, any> = {
  note: MessageSquare,
  stage_change: ArrowRightLeft,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckSquare,
};

const typeLabels: Record<string, string> = {
  note: "Nota",
  stage_change: "Mudança de etapa",
  call: "Ligação",
  email: "Email",
  meeting: "Reunião",
  task: "Tarefa",
};

interface Props {
  leadId: string;
}

export function LeadTimeline({ leadId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      await supabase.from("crm_activities").insert({
        lead_id: leadId,
        user_id: user!.id,
        type: "note",
        content: note,
      });
    },
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["crm-activities", leadId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Adicionar nota..."
          value={note}
          onChange={e => setNote(e.target.value)}
          className="min-h-[60px] text-sm"
        />
        <Button size="sm" disabled={!note.trim()} onClick={() => addNote.mutate()} className="shrink-0 self-end">
          Enviar
        </Button>
      </div>

      <div className="space-y-3">
        {activities.map((a: any) => {
          const Icon = typeIcons[a.type] || MessageSquare;
          return (
            <div key={a.id} className="flex gap-3 text-sm">
              <div className="mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{typeLabels[a.type] || a.type}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                {a.content && <p className="text-muted-foreground text-xs mt-0.5">{a.content}</p>}
                {a.type === "stage_change" && a.details && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(a.details as any).from_name} → {(a.details as any).to_name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
