import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowRight, Plus, Trash2, Edit, CheckCircle, FileText, Tag } from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
  user_id: string;
  display_name?: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  created: { icon: Plus, label: "Criado", color: "text-green-500" },
  status_changed: { icon: ArrowRight, label: "Status alterado", color: "text-blue-500" },
  priority_changed: { icon: Tag, label: "Prioridade alterada", color: "text-orange-500" },
  edited: { icon: Edit, label: "Editado", color: "text-yellow-500" },
  subtask_added: { icon: Plus, label: "Subtarefa adicionada", color: "text-primary" },
  subtask_completed: { icon: CheckCircle, label: "Subtarefa concluída", color: "text-green-500" },
  attachment_added: { icon: FileText, label: "Anexo adicionado", color: "text-purple-500" },
  deleted: { icon: Trash2, label: "Excluído", color: "text-red-500" },
};

export function ActivityLog({ itemId }: { itemId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, [itemId]);

  const loadEntries = async () => {
    const { data } = await supabase
      .from("demand_activity_log")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setEntries(data as ActivityEntry[]);
  };

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">Nenhuma atividade registrada.</p>;
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
      {entries.map(entry => {
        const config = ACTION_CONFIG[entry.action] || { icon: Clock, label: entry.action, color: "text-muted-foreground" };
        const Icon = config.icon;
        return (
          <div key={entry.id} className="flex items-start gap-2 text-xs py-1">
            <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <span className="font-medium">{config.label}</span>
              {entry.details?.from && entry.details?.to && (
                <span className="text-muted-foreground"> {entry.details.from} → {entry.details.to}</span>
              )}
              {entry.details?.title && (
                <span className="text-muted-foreground"> "{entry.details.title}"</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(entry.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
