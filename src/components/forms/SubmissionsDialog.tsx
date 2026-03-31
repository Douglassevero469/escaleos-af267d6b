import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Inbox, Download, Tag, X, Save, Edit2, ChevronLeft, MessageSquare, Plus,
} from "lucide-react";

interface Props {
  formId: string;
  formName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
];

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function SubmissionsDialog({ formId, formName, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["form-submissions", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("form_submissions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-submissions", formId] });
      toast({ title: "Resposta atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const filtered = filter === "all"
    ? submissions
    : submissions.filter((s: any) => (s.status || "complete") === filter);

  const selected = selectedId ? submissions.find((s: any) => s.id === selectedId) : null;

  const allKeys = Array.from(
    new Set(filtered.flatMap((s: any) => Object.keys(typeof s.data === "object" && s.data ? s.data : {})))
  );

  const completeCount = submissions.filter((s: any) => (s.status || "complete") === "complete").length;
  const incompleteCount = submissions.filter((s: any) => s.status === "incomplete").length;

  const addTag = (submissionId: string, currentTags: string[]) => {
    if (!newTag.trim()) return;
    const tags = [...(currentTags || []), newTag.trim()];
    updateMutation.mutate({ id: submissionId, updates: { tags } });
    setNewTag("");
  };

  const removeTag = (submissionId: string, currentTags: string[], tagToRemove: string) => {
    const tags = (currentTags || []).filter((t) => t !== tagToRemove);
    updateMutation.mutate({ id: submissionId, updates: { tags } });
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Data", "Status", "Etiquetas", ...allKeys];
    const rows = filtered.map((s: any) => {
      const d = typeof s.data === "object" && s.data ? s.data : {};
      return [
        new Date(s.created_at).toLocaleString("pt-BR"),
        (s.status || "complete") === "complete" ? "Completo" : "Incompleto",
        ((s.tags as string[]) || []).join("; "),
        ...allKeys.map((k) => (d as any)[k] ?? ""),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respostas-${formId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selected && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedId(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {selected ? "Detalhes da Resposta" : `Respostas — ${formName}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !submissions.length ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma resposta ainda</p>
          </div>
        ) : selected ? (
          <SubmissionDetail
            submission={selected}
            newTag={newTag}
            setNewTag={setNewTag}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onUpdate={updateMutation.mutate}
            isPending={updateMutation.isPending}
          />
        ) : (
          <div className="space-y-3 overflow-auto flex-1">
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                  Todas ({submissions.length})
                </Button>
                <Button variant={filter === "complete" ? "default" : "outline"} size="sm" onClick={() => setFilter("complete")}>
                  Completas ({completeCount})
                </Button>
                <Button variant={filter === "incomplete" ? "default" : "outline"} size="sm" onClick={() => setFilter("incomplete")}>
                  Incompletas ({incompleteCount})
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Etiquetas</TableHead>
                    {allKeys.slice(0, 3).map((k) => (
                      <TableHead key={k}>{k}</TableHead>
                    ))}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: any) => {
                    const d = typeof s.data === "object" && s.data ? s.data : {};
                    const isComplete = (s.status || "complete") === "complete";
                    const tags = (s.tags as string[]) || [];
                    return (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/60" onClick={() => setSelectedId(s.id)}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isComplete ? "default" : "secondary"}
                            className={isComplete ? "" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}
                          >
                            {isComplete ? "Completo" : "Incompleto"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {tags.slice(0, 2).map((t) => (
                              <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTagColor(t)}`}>
                                {t}
                              </span>
                            ))}
                            {tags.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">+{tags.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        {allKeys.slice(0, 3).map((k) => (
                          <TableCell key={k} className="text-sm max-w-[150px] truncate">
                            {String((d as any)[k] ?? "")}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedId(s.id); }}>
                            <Edit2 className="h-3 w-3 mr-1" /> Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Submission detail view ─── */
function SubmissionDetail({
  submission,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
  onUpdate,
  isPending,
}: {
  submission: any;
  newTag: string;
  setNewTag: (v: string) => void;
  onAddTag: (id: string, tags: string[]) => void;
  onRemoveTag: (id: string, tags: string[], tag: string) => void;
  onUpdate: (args: { id: string; updates: Record<string, any> }) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(submission.notes || "");
  const data = typeof submission.data === "object" && submission.data ? submission.data : {};
  const tags = (submission.tags as string[]) || [];
  const isComplete = (submission.status || "complete") === "complete";

  const startEditing = () => {
    setEditData(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")])));
    setEditing(true);
  };

  const saveEdits = () => {
    onUpdate({ id: submission.id, updates: { data: editData } });
    setEditing(false);
  };

  const saveNotes = () => {
    onUpdate({ id: submission.id, updates: { notes } });
  };

  return (
    <div className="space-y-4 overflow-auto flex-1">
      {/* Header info */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          variant={isComplete ? "default" : "secondary"}
          className={isComplete ? "" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}
        >
          {isComplete ? "Completo" : "Incompleto"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(submission.created_at).toLocaleString("pt-BR")}
        </span>
        {submission.ip_address && (
          <span className="text-xs text-muted-foreground">IP: {submission.ip_address}</span>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Etiquetas</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((t) => (
            <span key={t} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getTagColor(t)}`}>
              {t}
              <button onClick={() => onRemoveTag(submission.id, tags, t)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nova etiqueta..."
              className="h-7 w-32 text-xs"
              onKeyDown={(e) => e.key === "Enter" && onAddTag(submission.id, tags)}
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTag(submission.id, tags)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Data fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dados do Lead</span>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit2 className="h-3 w-3 mr-1" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button size="sm" onClick={saveEdits} disabled={isPending}>
                <Save className="h-3 w-3 mr-1" /> Salvar
              </Button>
            </div>
          )}
        </div>
        <div className="border rounded-lg divide-y">
          {Object.entries(editing ? editData : data).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm font-medium text-muted-foreground w-1/3 shrink-0">{key}</span>
              {editing ? (
                <Input
                  value={editData[key] || ""}
                  onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                  className="h-8 text-sm"
                />
              ) : (
                <span className="text-sm">{String(value ?? "")}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Notas internas</span>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione notas sobre este lead..."
          className="min-h-[80px] text-sm"
        />
        <Button variant="outline" size="sm" onClick={saveNotes} disabled={isPending || notes === (submission.notes || "")}>
          <Save className="h-3 w-3 mr-1" /> Salvar notas
        </Button>
      </div>
    </div>
  );
}
