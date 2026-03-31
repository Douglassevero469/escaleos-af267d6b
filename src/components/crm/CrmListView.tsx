import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CrmLead, getActionType } from "./LeadCard";
import type { StageDef } from "./KanbanStageColumn";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  leads: CrmLead[];
  stages: StageDef[];
  onLeadClick: (lead: CrmLead) => void;
}

export function CrmListView({ leads, stages, onLeadClick }: Props) {
  const stageName = (id: string) => stages.find(s => s.id === id)?.name || id;
  const stageColor = (id: string) => stages.find(s => s.id === id)?.color || "#6b7280";

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Próxima Ação</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map(lead => (
            <TableRow key={lead.id} className="cursor-pointer" onClick={() => onLeadClick(lead)}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{lead.name || "Sem nome"}</p>
                  {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                </div>
              </TableCell>
              <TableCell className="text-sm">{lead.email}</TableCell>
              <TableCell>
                {lead.form_name ? (
                  <Badge variant="outline" className="text-xs gap-1">
                    <FileText className="h-3 w-3" />
                    {lead.form_name}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Manual</span>
                )}
              </TableCell>
              <TableCell>
                {lead.next_action_type ? (() => {
                  const action = getActionType(lead.next_action_type);
                  const ActionIcon = action.icon;
                  const isOverdue = lead.next_action_date && new Date(lead.next_action_date) < new Date();
                  return (
                    <div className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-destructive" : action.color)}>
                      <ActionIcon className="h-3 w-3" />
                      <span>{action.label}</span>
                      {lead.next_action_date && (
                        <span className="text-muted-foreground ml-1">
                          {format(new Date(lead.next_action_date), "dd/MM")}
                        </span>
                      )}
                    </div>
                  );
                })() : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs" style={{ borderColor: stageColor(lead.stage) }}>
                  <div className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: stageColor(lead.stage) }} />
                  {stageName(lead.stage)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{lead.score}</TableCell>
              <TableCell className="text-sm">
                {Number(lead.value) > 0 ? Number(lead.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(lead.created_at), "dd/MM/yyyy")}
              </TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
