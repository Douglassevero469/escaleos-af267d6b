import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { ArrowLeft, ArrowRight, Send, Loader2, Plus, Trash2, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const stepNames = ["Identidade", "Financeiro", "Produto", "Concorrentes", "Operacional", "Mídia", "Revisão"];

const DOC_TYPES = ["planejamento", "concorrentes", "funil", "midia", "criativos", "playbook", "script", "objecoes", "landing_page", "followup", "calendario_editorial", "email_marketing"] as const;
const DOC_TITLES: Record<string, string> = {
  planejamento: "Planejamento Estratégico",
  concorrentes: "Análise de Concorrentes",
  funil: "Funil de Vendas",
  midia: "Plano de Mídia",
  criativos: "Criativos Prontos",
  playbook: "Playbook Comercial",
  script: "Script de Vendas",
  objecoes: "Tabela de Objeções",
  landing_page: "Landing Page de Alta Conversão",
  followup: "Cadência de Mensagens Follow-up",
  calendario_editorial: "Calendário Editorial de Conteúdo",
  email_marketing: "Estratégia de Email Marketing",
};

interface Concorrente {
  nome: string;
  pontoFraco: string;
  pontoForte: string;
  precoEstimado: string;
  siteConcorrente: string;
}

interface BriefingFormData {
  nomeEmpresa: string;
  nichoAtuacao: string;
  tempoMercado: string;
  regiaoAtuacao: string;
  instagramEmpresa: string;
  siteEmpresa: string;
  faturamentoAtual: string;
  metaFaturamento: string;
  ticketMedio: string;
  orcamentoAnuncios: string;
  nomeProduto: string;
  precoProduto: string;
  garantia: string;
  diferenciais: string[];
  perfilClienteIdeal: string;
  doresPublico: string[];
  desejosPublico: string[];
  concorrentes: Concorrente[];
  equipeVendas: string;
  ferramentas: string;
  gargalo: string;
  objecoes: string[];
  tomDeVoz: string;
  canaisAtendimento: string[];
  objetivoCampanha: string;
  plataformasAnuncio: string[];
  jaInvesteAnuncios: string;
  investimentoMidia: string;
  resultadosAtuais: string;
  coresMarca: string;
  provaSocial: string;
}

const defaultData: BriefingFormData = {
  nomeEmpresa: "", nichoAtuacao: "", tempoMercado: "", regiaoAtuacao: "",
  instagramEmpresa: "", siteEmpresa: "",
  faturamentoAtual: "", metaFaturamento: "", ticketMedio: "", orcamentoAnuncios: "",
  nomeProduto: "", precoProduto: "", garantia: "",
  diferenciais: ["", "", ""],
  perfilClienteIdeal: "",
  doresPublico: ["", "", ""],
  desejosPublico: ["", "", ""],
  concorrentes: [
    { nome: "", pontoFraco: "", pontoForte: "", precoEstimado: "", siteConcorrente: "" },
    { nome: "", pontoFraco: "", pontoForte: "", precoEstimado: "", siteConcorrente: "" },
    { nome: "", pontoFraco: "", pontoForte: "", precoEstimado: "", siteConcorrente: "" },
  ],
  equipeVendas: "", ferramentas: "", gargalo: "",
  objecoes: ["", "", ""],
  tomDeVoz: "",
  canaisAtendimento: [],
  objetivoCampanha: "",
  plataformasAnuncio: [],
  jaInvesteAnuncios: "",
  investimentoMidia: "", resultadosAtuais: "",
  coresMarca: "", provaSocial: "",
};

export default function NovoBriefing() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BriefingFormData>(defaultData);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").order("name");
      return data ?? [];
    },
  });

  // Load template data if ?template=ID is present
  const templateId = searchParams.get("template");
  const { data: templateData } = useQuery({
    queryKey: ["template", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data } = await supabase.from("templates").select("*").eq("id", templateId!).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (templateData?.briefing_data && typeof templateData.briefing_data === "object") {
      const bd = templateData.briefing_data as any;
      setData(prev => ({
        ...prev,
        ...bd,
        diferenciais: bd.diferenciais || prev.diferenciais,
        doresPublico: bd.doresPublico || prev.doresPublico,
        desejosPublico: bd.desejosPublico || prev.desejosPublico,
        objecoes: bd.objecoes || prev.objecoes,
        concorrentes: bd.concorrentes || prev.concorrentes,
        canaisAtendimento: bd.canaisAtendimento || prev.canaisAtendimento,
        plataformasAnuncio: bd.plataformasAnuncio || prev.plataformasAnuncio,
      }));
      toast({ title: `Template "${templateData.name}" carregado!`, description: "Campos pré-preenchidos." });
    }
  }, [templateData]);

  const saveAsTemplate = async () => {
    if (!user || !templateName) return;
    const { error } = await supabase.from("templates").insert({
      name: templateName,
      description: templateDesc || null,
      user_id: user.id,
      briefing_data: data as any,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    setSaveTemplateOpen(false);
    setTemplateName("");
    setTemplateDesc("");
    toast({ title: "Briefing salvo como template!" });
  };

  const set = (key: keyof BriefingFormData, value: any) => setData(prev => ({ ...prev, [key]: value }));

  const setArrayItem = (key: keyof BriefingFormData, index: number, value: string) => {
    setData(prev => {
      const arr = [...(prev[key] as string[])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  };

  const setConcorrente = (index: number, field: keyof Concorrente, value: string) => {
    setData(prev => {
      const concs = [...prev.concorrentes];
      concs[index] = { ...concs[index], [field]: value };
      return { ...prev, concorrentes: concs };
    });
  };

  const toggleArray = (key: keyof BriefingFormData, value: string) => {
    setData(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const next = () => step < 6 && setStep(s => s + 1);
  const prev = () => step > 0 && setStep(s => s - 1);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      let clientId = selectedClient;

      if (!clientId && data.nomeEmpresa) {
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({ name: data.nomeEmpresa, nicho: data.nichoAtuacao || null, instagram: data.instagramEmpresa || null, site: data.siteEmpresa || null, user_id: user.id })
          .select("id")
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      if (!clientId) {
        toast({ title: "Preencha o nome da empresa ou selecione um cliente", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { data: briefing, error: briefErr } = await supabase
        .from("briefings")
        .insert({ client_id: clientId, user_id: user.id, data: data as any, status: "completed" })
        .select("id")
        .single();
      if (briefErr) throw briefErr;

      const { data: pkg, error: pkgErr } = await supabase
        .from("packages")
        .insert({ briefing_id: briefing.id, client_id: clientId, user_id: user.id, status: "generating" })
        .select("id")
        .single();
      if (pkgErr) throw pkgErr;

      // Create document placeholders for all 8 doc types
      const docInserts = DOC_TYPES.map(docType => ({
        package_id: pkg.id,
        user_id: user.id,
        doc_type: docType,
        title: DOC_TITLES[docType],
        status: "pending",
        content: null,
      }));
      const { error: docErr } = await supabase.from("documents").insert(docInserts);
      if (docErr) throw docErr;

      toast({ title: "Briefing enviado!", description: "Seus 12 documentos serão gerados com IA." });
      navigate(`/pacote/${pkg.id}`);
    } catch (e: any) {
      toast({ title: "Erro ao salvar briefing", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (label: string, field: keyof BriefingFormData, placeholder?: string, textarea?: boolean) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {textarea ? (
        <Textarea value={(data[field] as string) || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="bg-muted/50 border-border/60 min-h-[80px]" />
      ) : (
        <Input value={(data[field] as string) || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="bg-muted/50 border-border/60" />
      )}
    </div>
  );

  const renderArrayField = (label: string, field: keyof BriefingFormData, placeholder?: string) => {
    const arr = data[field] as string[];
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}</Label>
        {arr.map((val, i) => (
          <Input key={`${field}-${i}`} value={val} onChange={e => setArrayItem(field, i, e.target.value)} placeholder={`${placeholder || ""} ${i + 1}`} className="bg-muted/50 border-border/60" />
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => set(field, [...arr, ""])} className="text-xs gap-1">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
    );
  };

  const canaisOptions = ["WhatsApp", "Telefone", "Email", "Instagram DM", "Chat do site", "Presencial"];
  const plataformasOptions = ["Meta Ads (Facebook/Instagram)", "Google Ads", "TikTok Ads", "LinkedIn Ads", "YouTube Ads", "Pinterest Ads"];

  const steps = [
    // Step 0: Identidade
    <div key={0} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Identidade do Negócio</h3>
      {clients.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Cliente Existente (opcional)</Label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="bg-muted/50 border-border/60"><SelectValue placeholder="Selecione um cliente existente..." /></SelectTrigger>
            <SelectContent>
              {clients.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}
      {renderField("Nome da Empresa *", "nomeEmpresa", "Ex: Studio Fitness Prime")}
      {renderField("Nicho / Segmento *", "nichoAtuacao", "Ex: Academia, Personal Trainer")}
      {renderField("Tempo de Mercado", "tempoMercado", "Ex: 3 anos")}
      {renderField("Região de Atuação", "regiaoAtuacao", "Ex: São Paulo - SP")}
      {renderField("Instagram", "instagramEmpresa", "@empresa")}
      {renderField("Site", "siteEmpresa", "https://...")}
    </div>,

    // Step 1: Financeiro
    <div key={1} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Dados Financeiros</h3>
      {renderField("Faturamento Mensal Atual *", "faturamentoAtual", "Ex: R$ 50.000")}
      {renderField("Meta de Faturamento *", "metaFaturamento", "Ex: R$ 100.000")}
      {renderField("Ticket Médio *", "ticketMedio", "Ex: R$ 150")}
      {renderField("Orçamento para Anúncios", "orcamentoAnuncios", "Ex: R$ 3.000/mês")}
    </div>,

    // Step 2: Produto
    <div key={2} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Produto e Público</h3>
      {renderField("Nome do Produto/Serviço Principal *", "nomeProduto", "Ex: Plano Premium Anual")}
      {renderField("Preço do Produto *", "precoProduto", "Ex: R$ 299/mês")}
      {renderField("Garantia", "garantia", "Ex: 30 dias de garantia")}
      {renderArrayField("Diferenciais", "diferenciais", "Diferencial")}
      {renderField("Perfil do Cliente Ideal *", "perfilClienteIdeal", "Idade, gênero, localização, interesses...", true)}
      {renderArrayField("Dores do Público *", "doresPublico", "Dor")}
      {renderArrayField("Desejos do Público *", "desejosPublico", "Desejo")}
    </div>,

    // Step 3: Concorrentes
    <div key={3} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Análise de Concorrentes</h3>
      {data.concorrentes.map((conc, i) => (
        <GlassCard key={i} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">Concorrente {i + 1}</p>
            {data.concorrentes.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => set("concorrentes", data.concorrentes.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Input value={conc.nome} onChange={e => setConcorrente(i, "nome", e.target.value)} placeholder="Nome do concorrente" className="bg-muted/50 border-border/60" />
          <Input value={conc.pontoForte} onChange={e => setConcorrente(i, "pontoForte", e.target.value)} placeholder="Pontos Fortes" className="bg-muted/50 border-border/60" />
          <Input value={conc.pontoFraco} onChange={e => setConcorrente(i, "pontoFraco", e.target.value)} placeholder="Pontos Fracos" className="bg-muted/50 border-border/60" />
          <Input value={conc.precoEstimado} onChange={e => setConcorrente(i, "precoEstimado", e.target.value)} placeholder="Preço Estimado" className="bg-muted/50 border-border/60" />
          <Input value={conc.siteConcorrente} onChange={e => setConcorrente(i, "siteConcorrente", e.target.value)} placeholder="Site do concorrente" className="bg-muted/50 border-border/60" />
        </GlassCard>
      ))}
      <Button variant="ghost" size="sm" onClick={() => set("concorrentes", [...data.concorrentes, { nome: "", pontoFraco: "", pontoForte: "", precoEstimado: "", siteConcorrente: "" }])} className="gap-1">
        <Plus className="h-3 w-3" /> Adicionar Concorrente
      </Button>
    </div>,

    // Step 4: Operacional
    <div key={4} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Operacional</h3>
      {renderField("Equipe de Vendas", "equipeVendas", "Ex: 5 vendedores + 1 gerente")}
      {renderField("Ferramentas Utilizadas", "ferramentas", "CRM, email marketing, etc.", true)}
      {renderField("Principal Gargalo *", "gargalo", "Maior dificuldade operacional", true)}
      {renderArrayField("Objeções Frequentes dos Clientes", "objecoes", "Objeção")}
      {renderField("Tom de Voz da Marca *", "tomDeVoz", "Ex: Profissional mas acessível, direto e confiante")}
      <div className="space-y-2">
        <Label className="text-sm">Canais de Atendimento</Label>
        <div className="flex flex-wrap gap-2">
          {canaisOptions.map(c => (
            <Button key={c} type="button" variant={data.canaisAtendimento.includes(c) ? "default" : "outline"} size="sm"
              onClick={() => toggleArray("canaisAtendimento", c)} className="text-xs">
              {c}
            </Button>
          ))}
        </div>
      </div>
    </div>,

    // Step 5: Mídia
    <div key={5} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Mídia e Marca</h3>
      {renderField("Objetivo da Campanha", "objetivoCampanha", "Ex: Gerar leads qualificados para vendas")}
      <div className="space-y-2">
        <Label className="text-sm">Plataformas de Anúncio</Label>
        <div className="flex flex-wrap gap-2">
          {plataformasOptions.map(p => (
            <Button key={p} type="button" variant={data.plataformasAnuncio.includes(p) ? "default" : "outline"} size="sm"
              onClick={() => toggleArray("plataformasAnuncio", p)} className="text-xs">
              {p}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Já investe em anúncios?</Label>
        <div className="flex gap-2">
          {["sim", "não"].map(v => (
            <Button key={v} type="button" variant={data.jaInvesteAnuncios === v ? "default" : "outline"} size="sm"
              onClick={() => set("jaInvesteAnuncios", v)} className="text-xs capitalize">
              {v}
            </Button>
          ))}
        </div>
      </div>
      {renderField("Investimento Mensal em Mídia", "investimentoMidia", "Ex: R$ 5.000/mês")}
      {data.jaInvesteAnuncios === "sim" &&
        renderField("Resultados Atuais com Anúncios", "resultadosAtuais", "CPL, ROAS, volume de leads...", true)}
      {renderField("Cores da Marca", "coresMarca", "Ex: Azul marinho, dourado")}
      {renderField("Prova Social", "provaSocial", "Depoimentos, cases, números", true)}
    </div>,

    // Step 6: Revisão
    <div key={6} className="space-y-4 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Revisão e Confirmação</h3>
      <GlassCard className="space-y-3">
        <ReviewItem label="Empresa" value={data.nomeEmpresa} />
        <ReviewItem label="Nicho" value={data.nichoAtuacao} />
        <ReviewItem label="Região" value={data.regiaoAtuacao} />
        <ReviewItem label="Faturamento Atual" value={data.faturamentoAtual} />
        <ReviewItem label="Meta" value={data.metaFaturamento} />
        <ReviewItem label="Ticket Médio" value={data.ticketMedio} />
        <ReviewItem label="Produto" value={`${data.nomeProduto} — ${data.precoProduto}`} />
        <ReviewItem label="Garantia" value={data.garantia} />
        <ReviewItem label="Diferenciais" value={data.diferenciais.filter(Boolean).join(", ")} />
        <ReviewItem label="Perfil Cliente Ideal" value={data.perfilClienteIdeal} />
        <ReviewItem label="Dores" value={data.doresPublico.filter(Boolean).join(", ")} />
        <ReviewItem label="Desejos" value={data.desejosPublico.filter(Boolean).join(", ")} />
        <ReviewItem label="Concorrentes" value={data.concorrentes.filter(c => c.nome).map(c => c.nome).join(", ")} />
        <ReviewItem label="Gargalo" value={data.gargalo} />
        <ReviewItem label="Tom de Voz" value={data.tomDeVoz} />
        <ReviewItem label="Plataformas" value={data.plataformasAnuncio.join(", ")} />
        <ReviewItem label="Canais" value={data.canaisAtendimento.join(", ")} />
      </GlassCard>
      <GlassCard className="p-4">
        <p className="text-sm font-semibold mb-2">Documentos que serão gerados:</p>
        <div className="grid grid-cols-2 gap-2">
          {DOC_TYPES.map(t => (
            <span key={t} className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
              {DOC_TITLES[t]}
            </span>
          ))}
        </div>
      </GlassCard>
    </div>,
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Novo Briefing</h1>
        <p className="text-sm text-muted-foreground font-light">Preencha as informações do cliente</p>
      </div>

      <StepIndicator steps={stepNames} currentStep={step} />

      <GlassCard>{steps[step]}</GlassCard>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2 border-border/60">
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <div className="flex gap-2">
          {step === 6 && (
            <Button variant="outline" onClick={() => setSaveTemplateOpen(true)} className="gap-2 border-border/60">
              <Save className="h-4 w-4" /> Salvar Template
            </Button>
          )}
          {step < 6 ? (
            <Button onClick={next} className="gap-2 btn-primary-glow font-semibold">
              Próximo <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="gap-2 btn-primary-glow font-semibold">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar Pacote <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Save as Template Dialog */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar como Template</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome do Template *</Label>
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ex: Template Academia Premium" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Descreva para que serve..." className="min-h-[80px]" />
            </div>
            <Button onClick={saveAsTemplate} disabled={!templateName} className="w-full btn-primary-glow">
              <Save className="h-4 w-4 mr-2" /> Salvar Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-sm py-1.5 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium max-w-[60%] truncate">{value}</span>
    </div>
  );
}


