import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ArrowLeft, Save, Eye, Smartphone, Monitor, Globe, Loader2, Trash2, GripVertical, Plus,
  Type, AlignLeft, Mail, Phone, Hash, ChevronDown, CheckSquare, Circle, ToggleLeft,
  ThumbsUp, List, Calendar, Upload, Heading, FileText, Minus, MoveVertical, Settings,
  ImageIcon, Link, Fingerprint, DollarSign, Star, SlidersHorizontal, LayoutGrid,
  Clock, CalendarClock, Copy, ExternalLink, TrendingUp,
} from "lucide-react";
import { FormField, FIELD_TYPES, FIELD_TYPE_CATEGORIES, createField } from "@/lib/form-field-types";
import { FORM_THEMES } from "@/lib/form-themes";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FormSubmissions from "@/components/forms/FormSubmissions";
import FormAnalytics from "@/components/forms/FormAnalytics";
import FormRenderer from "@/components/forms/FormRenderer";

const ICON_MAP: Record<string, any> = {
  Type, AlignLeft, Mail, Phone, Hash, ChevronDown, CheckSquare, Circle, ToggleLeft,
  ThumbsUp, List, Calendar, Upload, Heading, FileText, Minus, MoveVertical,
  Link, Fingerprint, DollarSign, Star, SlidersHorizontal, LayoutGrid, ImageIcon,
  Clock, CalendarClock,
};

function SortableField({
  field, isSelected, onSelect, onRemove,
}: { field: FormField; isSelected: boolean; onSelect: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] shrink-0">
            {FIELD_TYPES.find(f => f.type === field.type)?.label || field.type}
          </Badge>
          <span className="text-sm font-medium truncate">{field.label}</span>
          {field.required && <span className="text-destructive text-xs">*</span>}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [layout, setLayout] = useState("list");
  const [status, setStatus] = useState("draft");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState("editor");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<any>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: formData, isLoading } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("forms").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  useEffect(() => {
    if (formData) {
      setFormName(formData.name);
      setFormDesc(formData.description || "");
      setLayout(formData.layout);
      setStatus(formData.status);
      setFields(Array.isArray(formData.fields) ? (formData.fields as any as FormField[]) : []);
      setSettings(typeof formData.settings === 'object' && formData.settings ? formData.settings : {});
    }
  }, [formData]);

  const saveMutation = useMutation({
    mutationFn: async (newStatus: string | null = null) => {
      const finalStatus = newStatus || status;
      const { error } = await supabase
        .from("forms")
        .update({
          name: formName,
          description: formDesc || null,
          layout,
          fields: fields as any,
          settings: settings as any,
          status: finalStatus,
        })
        .eq("id", id!);
      if (error) throw error;
      if (newStatus) setStatus(finalStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", id] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast({ title: "Formulário salvo!" });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields(prev => {
        const oldIndex = prev.findIndex(f => f.id === active.id);
        const newIndex = prev.findIndex(f => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addField = (type: string) => {
    const newField = createField(type);
    setFields(prev => [...prev, newField]);
    setSelectedId(newField.id);
  };

  const removeField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    if (selectedId === fieldId) setSelectedId(null);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const selectedField = fields.find(f => f.id === selectedId);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={formName}
          onChange={e => setFormName(e.target.value)}
          className="max-w-xs font-semibold"
          placeholder="Nome do formulário"
        />
        <Badge variant={status === "published" ? "default" : "secondary"}>
          {status === "published" ? "Publicado" : "Rascunho"}
        </Badge>
        <div className="flex items-center gap-1 ml-auto">
          <Select value={layout} onValueChange={setLayout}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">Lista</SelectItem>
              <SelectItem value="card">Cartão</SelectItem>
              <SelectItem value="inline">Corrido</SelectItem>
              <SelectItem value="stepper">Multi-step</SelectItem>
              <SelectItem value="chat">Chat Mode</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button variant={previewMode === "desktop" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setPreviewMode("desktop")}>
              <Monitor className="h-4 w-4" />
            </Button>
            <Button variant={previewMode === "mobile" ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setPreviewMode("mobile")}>
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(!settingsOpen)}>
            <Settings className="h-4 w-4 mr-1" /> Config
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveMutation.mutate(null)} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate(status === "published" ? "draft" : "published")} disabled={saveMutation.isPending}>
            <Globe className="h-4 w-4 mr-1" />
            {status === "published" ? "Despublicar" : "Publicar"}
          </Button>
        </div>
      </div>

      {/* Published Link Banner */}
      {status === "published" && formData?.slug && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <code className="text-xs flex-1 truncate text-muted-foreground">
            {window.location.origin}/f/{formData.slug}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/f/${formData.slug}`);
              toast({ title: "Link copiado!" });
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
          </Button>
          <Button
            size="sm"
            onClick={() => window.open(`/f/${formData.slug}`, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Acessar
          </Button>
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <GlassCard className="p-4 space-y-4">
          <h4 className="font-semibold text-sm">Configurações do Formulário</h4>
          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {(settings as any)?.logoUrl ? (
                <img
                  src={(settings as any).logoUrl}
                  alt="Logo"
                  className="w-16 h-16 object-contain rounded-lg border border-border bg-muted/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/20">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Logo do Formulário</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    const ext = file.name.split(".").pop();
                    const path = `${user.id}/${id}/logo-${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("form-assets").upload(path, file, { upsert: true });
                    if (error) {
                      toast({ title: "Erro ao enviar logo", description: error.message, variant: "destructive" });
                      return;
                    }
                    const { data: urlData } = supabase.storage.from("form-assets").getPublicUrl(path);
                    setSettings((s: any) => ({ ...s, logoUrl: urlData.publicUrl }));
                    toast({ title: "Logo enviada!" });
                  }}
                />
                {(settings as any)?.logoUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 text-destructive"
                    onClick={() => setSettings((s: any) => ({ ...s, logoUrl: "" }))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Exibida no topo do formulário público</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="text-xs">Mensagem de Sucesso</Label>
              <Input
                value={(settings as any)?.successMessage || ""}
                onChange={e => setSettings((s: any) => ({ ...s, successMessage: e.target.value }))}
                placeholder="Obrigado! Entraremos em contato."
              />
            </div>
            <div>
              <Label className="text-xs">URL de Redirect</Label>
              <Input
                value={(settings as any)?.redirectUrl || ""}
                onChange={e => setSettings((s: any) => ({ ...s, redirectUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs">Cor do Botão (hex)</Label>
              <Input
                value={(settings as any)?.buttonColor || ""}
                onChange={e => setSettings((s: any) => ({ ...s, buttonColor: e.target.value }))}
                placeholder="#6366f1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-2 block">Tema Visual</Label>
            <div className="flex flex-wrap gap-2">
              {FORM_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSettings((s: any) => ({ ...s, theme: t.id }))}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                    ((settings as any)?.theme || "light") === t.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className="w-12 h-8 rounded-md border border-border/50 shadow-sm"
                    style={{ background: t.preview }}
                  />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Webhook (Notificação Externa)</h5>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">URL do Webhook</Label>
                <Input
                  value={(settings as any)?.webhookUrl || ""}
                  onChange={e => setSettings((s: any) => ({ ...s, webhookUrl: e.target.value }))}
                  placeholder="https://hooks.zapier.com/..."
                />
                <p className="text-[10px] text-muted-foreground mt-1">Recebe um POST JSON a cada nova submissão</p>
              </div>
              <div>
                <Label className="text-xs">Secret (opcional)</Label>
                <Input
                  value={(settings as any)?.webhookSecret || ""}
                  onChange={e => setSettings((s: any) => ({ ...s, webhookSecret: e.target.value }))}
                  placeholder="whsec_..."
                  type="password"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Enviado no header X-Webhook-Secret</p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1" /> Preview</TabsTrigger>
          <TabsTrigger value="responses">Respostas</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="h-3.5 w-3.5 mr-1" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]">
            {/* Left: Component Palette */}
            <GlassCard className="p-3 space-y-2 h-fit max-h-[70vh] overflow-y-auto">
              {FIELD_TYPE_CATEGORIES.map(cat => (
                <div key={cat.category}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2 first:mt-0">{cat.category}</p>
                  {cat.types.map(ft => {
                    const Icon = ICON_MAP[ft.icon] || Type;
                    return (
                      <button
                        key={ft.type}
                        onClick={() => addField(ft.type)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate text-xs">{ft.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </GlassCard>

            {/* Center: Canvas */}
            <GlassCard className={`p-6 min-h-[400px] ${previewMode === "mobile" ? "max-w-sm mx-auto w-full" : ""}`}>
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                  <Plus className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Clique em um componente à esquerda para adicionar</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {fields.map(field => (
                        <SortableField
                          key={field.id}
                          field={field}
                          isSelected={selectedId === field.id}
                          onSelect={() => setSelectedId(field.id)}
                          onRemove={() => removeField(field.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </GlassCard>

            {/* Right: Properties Panel */}
            <GlassCard className="p-4 h-fit space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Propriedades</p>
              {selectedField ? (
                <>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedField.label}
                      onChange={e => updateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>
                  {!["heading", "paragraph", "divider", "spacer"].includes(selectedField.type) && (
                    <>
                      <div>
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={selectedField.placeholder || ""}
                          onChange={e => updateField(selectedField.id, { placeholder: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedField.required || false}
                          onCheckedChange={v => updateField(selectedField.id, { required: v })}
                        />
                        <Label className="text-xs">Obrigatório</Label>
                      </div>
                      <div>
                        <Label className="text-xs">Largura</Label>
                        <Select
                          value={selectedField.width || "full"}
                          onValueChange={v => updateField(selectedField.id, { width: v as "full" | "half" })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Inteira</SelectItem>
                            <SelectItem value="half">Metade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {["select", "radio", "radio_cards", "checkbox", "selection", "image_choice", "yes_no"].includes(selectedField.type) && (
                    <div>
                      <Label className="text-xs">Opções (uma por linha)</Label>
                      <Textarea
                        value={(selectedField.options || []).join("\n")}
                        onChange={e => updateField(selectedField.id, { options: e.target.value.split("\n") })}
                        rows={4}
                      />
                    </div>
                  )}
                  {["rating", "slider"].includes(selectedField.type) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground">Configuração</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedField.type === "slider" && (
                          <div>
                            <Label className="text-[10px]">Valor mínimo</Label>
                            <Input
                              type="number"
                              value={selectedField.validations?.min ?? 0}
                              onChange={e => updateField(selectedField.id, { validations: { ...selectedField.validations, min: Number(e.target.value) } })}
                            />
                          </div>
                        )}
                        <div>
                          <Label className="text-[10px]">{selectedField.type === "rating" ? "Nº de estrelas" : "Valor máximo"}</Label>
                          <Input
                            type="number"
                            value={selectedField.validations?.max ?? (selectedField.type === "rating" ? 5 : 100)}
                            onChange={e => updateField(selectedField.id, { validations: { ...selectedField.validations, max: Number(e.target.value) } })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {!["heading", "paragraph", "divider", "spacer", "yes_no", "switch", "checkbox", "file"].includes(selectedField.type) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground">Validações</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px]">Min length</Label>
                          <Input
                            type="number"
                            value={selectedField.validations?.minLength || ""}
                            onChange={e => updateField(selectedField.id, { validations: { ...selectedField.validations, minLength: Number(e.target.value) || undefined } })}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Max length</Label>
                          <Input
                            type="number"
                            value={selectedField.validations?.maxLength || ""}
                            onChange={e => updateField(selectedField.id, { validations: { ...selectedField.validations, maxLength: Number(e.target.value) || undefined } })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => removeField(selectedField.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover Campo
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Selecione um campo para editar suas propriedades</p>
              )}
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className={`mx-auto transition-all ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-3xl"}`}>
            <GlassCard className="overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2 truncate">
                  {window.location.origin}/f/{formData?.slug || "..."}
                </span>
              </div>
              {fields.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <p className="text-sm">Adicione campos no Editor para visualizar o preview</p>
                </div>
              ) : (
                <FormRenderer
                  formName={formName}
                  formDescription={formDesc}
                  layout={layout}
                  fields={fields}
                  settings={settings}
                  isPreview
                />
              )}
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="responses">
          <FormSubmissions formId={id!} />
        </TabsContent>

        <TabsContent value="analytics">
          <FormAnalytics formId={id!} formName={formName} formFields={fields} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
