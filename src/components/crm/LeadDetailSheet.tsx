import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LeadTimeline } from "./LeadTimeline";
import { CrmLead, NEXT_ACTION_TYPES, getActionType } from "./LeadCard";
import type { StageDef } from "./KanbanStageColumn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";

interface Props {
  lead: CrmLead | null;
  stages: StageDef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
}

export function LeadDetailSheet({ lead, stages, open, onOpenChange, pipelineId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", stage: "", score: 0, value: 0, notes: "" });

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        stage: lead.stage || "",
        score: lead.score || 0,
        value: Number(lead.value) || 0,
        notes: lead.notes || "",
      });
    }
  }, [lead]);

  const updateLead = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      const oldStage = lead.stage;
      await supabase.from("crm_leads").update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        stage: form.stage,
        score: form.score,
        value: form.value,
        notes: form.notes,
      }).eq("id", lead.id);

      if (oldStage !== form.stage) {
        const fromName = stages.find(s => s.id === oldStage)?.name || oldStage;
        const toName = stages.find(s => s.id === form.stage)?.name || form.stage;
        await supabase.from("crm_activities").insert({
          lead_id: lead.id,
          user_id: lead.user_id,
          type: "stage_change",
          content: `Movido de "${fromName}" para "${toName}"`,
          details: { from: oldStage, to: form.stage, from_name: fromName, to_name: toName },
        });
      }
    },
    onSuccess: () => {
      toast.success("Lead atualizado");
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      await supabase.from("crm_leads").delete().eq("id", lead.id);
    },
    onSuccess: () => {
      toast.success("Lead excluído");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{lead.name || "Lead sem nome"}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Dados</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
            {lead.form_submission_id && <TabsTrigger value="form" className="flex-1">Formulário</TabsTrigger>}
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Empresa</Label>
                <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Etapa</Label>
                <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Score</Label>
                <Input type="number" min={0} max={100} value={form.score} onChange={e => setForm(p => ({ ...p, score: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input type="number" min={0} value={form.value} onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="min-h-[80px]" />
            </div>

            {lead.form_id && (
              <Badge variant="outline" className="text-xs">Origem: Formulário</Badge>
            )}

            {lead.form_name && (
              <div className="p-3 border rounded-lg bg-muted/20">
                <span className="text-xs text-muted-foreground">Origem do lead:</span>
                <p className="text-sm font-medium">{lead.form_name}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={() => updateLead.mutate()} className="flex-1">Salvar</Button>
              <Button variant="destructive" size="icon" onClick={() => deleteLead.mutate()}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <LeadTimeline leadId={lead.id} />
          </TabsContent>

          {lead.form_submission_id && (
            <TabsContent value="form" className="mt-4">
              <FormSubmissionData submissionId={lead.form_submission_id} formId={lead.form_id} />
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function FormSubmissionData({ submissionId, formId }: { submissionId: string; formId?: string | null }) {
  const [submission, setSubmission] = useState<any>(null);
  const [formFields, setFormFields] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("form_submissions").select("data").eq("id", submissionId).single().then(({ data }) => {
      if (data) setSubmission(data.data);
    });
    if (formId) {
      supabase.from("forms").select("fields").eq("id", formId).single().then(({ data }) => {
        if (data?.fields && Array.isArray(data.fields)) {
          setFormFields((data.fields as any[]).map((f: any) => f.label || f.name || f.id).filter(Boolean));
        }
      });
    }
  }, [submissionId, formId]);

  if (!submission) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  // Order entries by form field order
  const entries = Object.entries(submission as Record<string, any>);
  const orderedEntries = formFields.length > 0
    ? [
        ...formFields.filter(k => entries.some(([ek]) => ek === k)).map(k => [k, (submission as any)[k]] as [string, any]),
        ...entries.filter(([k]) => !formFields.includes(k)),
      ]
    : entries;

  return (
    <div className="space-y-2">
      {orderedEntries.map(([key, val]) => (
        <div key={key} className="text-sm">
          <span className="font-medium text-xs text-muted-foreground">{key}</span>
          <p>{String(val)}</p>
        </div>
      ))}
    </div>
  );
}
