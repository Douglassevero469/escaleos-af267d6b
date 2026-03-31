import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mail, Phone, DollarSign, FileText } from "lucide-react";

export interface CrmLead {
  id: string;
  pipeline_id: string;
  user_id: string;
  form_submission_id: string | null;
  form_id: string | null;
  form_name?: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: string;
  position: number;
  score: number;
  value: number;
  tags: any[];
  notes: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  lost_at: string | null;
}

interface LeadCardProps {
  lead: CrmLead;
  onClick: () => void;
}

const scoreColor = (s: number) =>
  s >= 70 ? "text-green-600 bg-green-100" : s >= 40 ? "text-yellow-600 bg-yellow-100" : "text-muted-foreground bg-muted";

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{lead.name || "Sem nome"}</p>
          {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
        </div>
        {lead.score > 0 && (
          <span className={cn("text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0", scoreColor(lead.score))}>
            {lead.score}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {lead.email && (
          <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{lead.email}</span>
        )}
        {lead.phone && (
          <span className="flex items-center gap-1 truncate"><Phone className="h-3 w-3 shrink-0" />{lead.phone}</span>
        )}
      </div>

      {lead.value > 0 && (
        <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
          <DollarSign className="h-3 w-3" />
          {Number(lead.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      )}

      {lead.form_name && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <FileText className="h-3 w-3 shrink-0" />
          {lead.form_name}
        </span>
      )}

      {Array.isArray(lead.tags) && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map((tag: any, i: number) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{typeof tag === "string" ? tag : tag.label}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
