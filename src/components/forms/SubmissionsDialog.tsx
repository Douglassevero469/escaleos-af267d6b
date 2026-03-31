import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Inbox, Download, Tag, X, Save, Edit2, ChevronLeft, MessageSquare, Plus, ArrowLeft, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  formId: string;
  formName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TagItem {
  text: string;
  color: string;
}

const COLOR_OPTIONS = [
  { name: "Azul", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-800 dark:text-blue-300", dot: "bg-blue-500", value: "blue" },
  { name: "Verde", bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-800 dark:text-green-300", dot: "bg-green-500", value: "green" },
  { name: "Roxo", bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-800 dark:text-purple-300", dot: "bg-purple-500", value: "purple" },
  { name: "Laranja", bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-800 dark:text-orange-300", dot: "bg-orange-500", value: "orange" },
  { name: "Rosa", bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-800 dark:text-pink-300", dot: "bg-pink-500", value: "pink" },
  { name: "Ciano", bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-800 dark:text-cyan-300", dot: "bg-cyan-500", value: "cyan" },
  { name: "Vermelho", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-800 dark:text-red-300", dot: "bg-red-500", value: "red" },
  { name: "Amarelo", bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-800 dark:text-yellow-300", dot: "bg-yellow-500", value: "yellow" },
];

function getColorClasses(colorValue: string) {
  return COLOR_OPTIONS.find(c => c.value === colorValue) || COLOR_OPTIONS[0];
}

/** Parse tags — supports both legacy string[] and new {text, color}[] */
function parseTags(raw: any): TagItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t: any) => {
    if (typeof t === "object" && t?.text) return { text: t.text, color: t.color || "blue" };
    if (typeof t === "string") {
      // Try parsing JSON string like '{"text": "Qualificado", "color": "green"}'
      if (t.startsWith("{")) {
        try {
          const parsed = JSON.parse(t);
          if (parsed?.text) return { text: parsed.text, color: parsed.color || "blue" };
        } catch { /* fall through */ }
      }
      return { text: t, color: "blue" };
    }
    return null;
  }).filter(Boolean) as TagItem[];
}

function serializeTags(tags: TagItem[]): any[] {
  return tags.map(t => ({ text: t.text, color: t.color }));
}

export default function SubmissionsDialog({ formId, formName, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");

  // Fetch form fields to preserve ordering
  const { data: formFields = [] } = useQuery({
    queryKey: ["form-fields-order", formId],
    queryFn: async () => {
      const { data } = await supabase.from("forms").select("fields").eq("id", formId).single();
      if (!data?.fields || !Array.isArray(data.fields)) return [];
      return (data.fields as any[]).map((f: any) => f.label || f.name || f.id).filter(Boolean);
    },
    enabled: open,
  });

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

  const statusFiltered = filter === "all"
    ? submissions
    : submissions.filter((s: any) => (s.status || "complete") === filter);

  // All unique tags across submissions
  const allTags = Array.from(
    new Set(submissions.flatMap((s: any) => parseTags(s.tags).map(t => t.text)))
  ).sort();

  const filtered = tagFilter.length === 0
    ? statusFiltered
    : statusFiltered.filter((s: any) => {
        const tags = parseTags(s.tags).map(t => t.text);
        return tagFilter.some(tf => tags.includes(tf));
      });

  const selected = selectedId ? submissions.find((s: any) => s.id === selectedId) : null;

  // Order keys by form field order, then append any extra keys not in the form definition
  const rawKeys = Array.from(
    new Set(filtered.flatMap((s: any) => Object.keys(typeof s.data === "object" && s.data ? s.data : {})))
  );
  const allKeys = formFields.length > 0
    ? [...formFields.filter(k => rawKeys.includes(k)), ...rawKeys.filter(k => !formFields.includes(k))]
    : rawKeys;

  const completeCount = submissions.filter((s: any) => (s.status || "complete") === "complete").length;
  const incompleteCount = submissions.filter((s: any) => s.status === "incomplete").length;

  const addTag = (submissionId: string, currentTags: TagItem[]) => {
    if (!newTag.trim()) return;
    const tags = serializeTags([...currentTags, { text: newTag.trim(), color: newTagColor }]);
    updateMutation.mutate({ id: submissionId, updates: { tags } });
    setNewTag("");
  };

  const removeTag = (submissionId: string, currentTags: TagItem[], index: number) => {
    const updated = currentTags.filter((_, i) => i !== index);
    updateMutation.mutate({ id: submissionId, updates: { tags: serializeTags(updated) } });
  };

  const changeTagColor = (submissionId: string, currentTags: TagItem[], index: number, color: string) => {
    const updated = currentTags.map((t, i) => i === index ? { ...t, color } : t);
    updateMutation.mutate({ id: submissionId, updates: { tags: serializeTags(updated) } });
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Data", "Status", "Etiquetas", ...allKeys];
    const rows = filtered.map((s: any) => {
      const d = typeof s.data === "object" && s.data ? s.data : {};
      const tags = parseTags(s.tags);
      return [
        new Date(s.created_at).toLocaleString("pt-BR"),
        (s.status || "complete") === "complete" ? "Completo" : "Incompleto",
        tags.map(t => t.text).join("; "),
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-3 shrink-0">
        {selected ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedId(null)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-lg font-semibold">
          {selected ? "Detalhes da Resposta" : `Respostas — ${formName}`}
        </h1>
        <span className="text-sm text-muted-foreground">
          {submissions.length} resposta{submissions.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {!selected && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
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
            newTagColor={newTagColor}
            setNewTagColor={setNewTagColor}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onChangeTagColor={changeTagColor}
            onUpdate={updateMutation.mutate}
            isPending={updateMutation.isPending}
          />
        ) : (
          <div className="space-y-3">
            {/* Status filters */}
            <div className="flex items-center gap-2 flex-wrap">
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

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mr-1">Filtrar por etiqueta:</span>
                {allTags.map(tag => {
                  const isActive = tagFilter.includes(tag);
                  // Find color from first submission that has this tag
                  const tagObj = submissions
                    .flatMap((s: any) => parseTags(s.tags))
                    .find(t => t.text === tag);
                  const c = getColorClasses(tagObj?.color || "blue");
                  return (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(prev =>
                        isActive ? prev.filter(t => t !== tag) : [...prev, tag]
                      )}
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full font-medium transition-all border",
                        isActive
                          ? cn(c.bg, c.text, "border-current")
                          : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
                {tagFilter.length > 0 && (
                  <button
                    onClick={() => setTagFilter([])}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}


            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Etiquetas</TableHead>
                    {allKeys.slice(0, 4).map((k) => (
                      <TableHead key={k}>{k}</TableHead>
                    ))}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: any) => {
                    const d = typeof s.data === "object" && s.data ? s.data : {};
                    const isComplete = (s.status || "complete") === "complete";
                    const tags = parseTags(s.tags);
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
                            {tags.slice(0, 3).map((t, i) => {
                              const c = getColorClasses(t.color);
                              return (
                                <span key={i} className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", c.bg, c.text)}>
                                  {t.text}
                                </span>
                              );
                            })}
                            {tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        {allKeys.slice(0, 4).map((k) => (
                          <TableCell key={k} className="text-sm max-w-[160px] truncate">
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
      </div>
    </div>
  );
}

/* ─── Submission detail ─── */
function SubmissionDetail({
  submission,
  newTag,
  setNewTag,
  newTagColor,
  setNewTagColor,
  onAddTag,
  onRemoveTag,
  onChangeTagColor,
  onUpdate,
  isPending,
}: {
  submission: any;
  newTag: string;
  setNewTag: (v: string) => void;
  newTagColor: string;
  setNewTagColor: (v: string) => void;
  onAddTag: (id: string, tags: TagItem[]) => void;
  onRemoveTag: (id: string, tags: TagItem[], index: number) => void;
  onChangeTagColor: (id: string, tags: TagItem[], index: number, color: string) => void;
  onUpdate: (args: { id: string; updates: Record<string, any> }) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(submission.notes || "");
  const data = typeof submission.data === "object" && submission.data ? submission.data : {};
  const tags = parseTags(submission.tags);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          variant={isComplete ? "default" : "secondary"}
          className={isComplete ? "" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}
        >
          {isComplete ? "Completo" : "Incompleto"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {new Date(submission.created_at).toLocaleString("pt-BR")}
        </span>
        {submission.ip_address && (
          <span className="text-sm text-muted-foreground">IP: {submission.ip_address}</span>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Etiquetas</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((t, i) => {
            const c = getColorClasses(t.color);
            return (
              <Popover key={i}>
                <PopoverTrigger asChild>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity", c.bg, c.text)}>
                    {t.text}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveTag(submission.id, tags, i); }}
                      className="hover:opacity-60"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Alterar cor</p>
                  <div className="flex gap-1.5 flex-wrap max-w-[180px]">
                    {COLOR_OPTIONS.map(co => (
                      <button
                        key={co.value}
                        onClick={() => onChangeTagColor(submission.id, tags, i, co.value)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          co.dot,
                          t.color === co.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                        )}
                        title={co.name}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
          {/* Add new tag */}
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn("w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-muted-foreground transition-colors", getColorClasses(newTagColor).dot)}>
                  <Palette className="h-3 w-3 text-white" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Cor da etiqueta</p>
                <div className="flex gap-1.5 flex-wrap max-w-[180px]">
                  {COLOR_OPTIONS.map(co => (
                    <button
                      key={co.value}
                      onClick={() => setNewTagColor(co.value)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        co.dot,
                        newTagColor === co.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                      )}
                      title={co.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nova etiqueta..."
              className="h-8 w-36 text-xs"
              onKeyDown={(e) => e.key === "Enter" && onAddTag(submission.id, tags)}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddTag(submission.id, tags)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Data fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Dados do Lead</span>
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
            <div key={key} className="flex items-center gap-4 px-4 py-3">
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Notas internas</span>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione notas sobre este lead..."
          className="min-h-[100px] text-sm"
        />
        <Button variant="outline" size="sm" onClick={saveNotes} disabled={isPending || notes === (submission.notes || "")}>
          <Save className="h-3 w-3 mr-1" /> Salvar notas
        </Button>
      </div>
    </div>
  );
}
