import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Send, Loader2, Plus, Trash2, CheckCircle, Upload, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stepNames = ["Identidade", "Financeiro", "Produto", "Concorrentes", "Operacional", "Mídia", "Revisão"];

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

export default function BriefingPublico() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BriefingFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const progress = ((step + 1) / stepNames.length) * 100;

  const set = (key: keyof BriefingFormData, value: any) => setData(prev => ({ ...prev, [key]: value }));

  const handleFileUpload = useCallback(async (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Envie um arquivo PDF ou DOC/DOCX", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-briefing-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Erro ao processar arquivo");

      const parsed = result.briefingData;

      // Merge parsed data with defaults, keeping arrays with at least 3 items
      setData(prev => {
        const merged = { ...prev };
        for (const key of Object.keys(parsed) as (keyof BriefingFormData)[]) {
          const val = parsed[key];
          if (val === undefined || val === null) continue;
          if (Array.isArray(val) && key !== "concorrentes" && key !== "canaisAtendimento" && key !== "plataformasAnuncio") {
            const arr = val.filter((v: string) => v && v.trim());
            while (arr.length < 3) arr.push("");
            (merged as any)[key] = arr;
          } else if (key === "concorrentes" && Array.isArray(val)) {
            const concs = val.filter((c: any) => c.nome);
            while (concs.length < 1) concs.push({ nome: "", pontoFraco: "", pontoForte: "", precoEstimado: "", siteConcorrente: "" });
            merged.concorrentes = concs;
          } else if (typeof val === "string" && val.trim()) {
            (merged as any)[key] = val;
          } else if (Array.isArray(val)) {
            (merged as any)[key] = val;
          }
        }
        return merged;
      });

      setUploadedFileName(file.name);
      toast({
        title: "✨ Documento processado!",
        description: "Os campos foram preenchidos automaticamente. Revise as informações antes de enviar.",
      });
    } catch (e: any) {
      toast({ title: "Erro ao processar documento", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [toast]);

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
    if (!data.nomeEmpresa) {
      toast({ title: "Preencha o nome da empresa", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-public-briefing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ briefingData: data }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Erro ao enviar");
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Erro ao enviar briefing", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (label: string, field: keyof BriefingFormData, placeholder?: string, textarea?: boolean) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      {textarea ? (
        <Textarea value={(data[field] as string) || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="bg-background/50 border-border/60 min-h-[80px]" />
      ) : (
        <Input value={(data[field] as string) || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} className="bg-background/50 border-border/60" />
      )}
    </div>
  );

  const renderArrayField = (label: string, field: keyof BriefingFormData, placeholder?: string) => {
    const arr = data[field] as string[];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/80">{label}</Label>
        {arr.map((val, i) => (
          <Input key={`${field}-${i}`} value={val} onChange={e => setArrayItem(field, i, e.target.value)} placeholder={`${placeholder || ""} ${i + 1}`} className="bg-background/50 border-border/60" />
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => set(field, [...arr, ""])} className="text-xs gap-1">
          <Plus className="h-3 w-3" /> Adicionar
        </Button>
      </div>
    );
  };

  const canaisOptions = ["WhatsApp", "Telefone", "Email", "Instagram DM", "Chat do site", "Presencial"];
  const plataformasOptions = ["Meta Ads (Facebook/Instagram)", "Google Ads", "TikTok Ads", "LinkedIn Ads", "YouTube Ads", "Pinterest Ads"];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Briefing Enviado!</h1>
          <p className="text-muted-foreground">
            Obrigado por preencher o briefing, <strong>{data.nomeEmpresa}</strong>. Nossa equipe irá analisar as informações e entrar em contato em breve.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>✅ Seus dados foram recebidos com sucesso</p>
            <p>📋 O briefing está aguardando aprovação do time</p>
            <p>🚀 Assim que aprovado, os documentos estratégicos serão gerados automaticamente</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    // Step 0: Identidade
    <div key={0} className="space-y-4 animate-fade-in">
      {/* Upload Section */}
      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-base font-semibold">Preenchimento Inteligente</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Envie um documento (PDF ou DOC) com as informações do seu negócio e preencheremos o formulário automaticamente.
        </p>

        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Analisando documento com IA...</span>
          </div>
        ) : uploadedFileName ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{uploadedFileName}</span>
            <span className="text-xs text-green-600 font-medium">✓ Processado</span>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
              disabled={uploading}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Upload className="h-4 w-4" />
              {uploadedFileName ? "Enviar outro arquivo" : "Enviar Documento"}
            </span>
          </label>
        </div>

        {uploadedFileName && (
          <p className="text-xs text-muted-foreground">
            Revise os campos preenchidos abaixo e ajuste o que for necessário.
          </p>
        )}
      </div>

      <div className="relative flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">ou preencha manualmente</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <h3 className="text-lg font-semibold">Identidade do Negócio</h3>
      {renderField("Nome da Empresa *", "nomeEmpresa", "Ex: Studio Fitness Prime")}
      {renderField("Nicho / Segmento *", "nichoAtuacao", "Ex: Academia, Personal Trainer")}
      {renderField("Tempo de Mercado", "tempoMercado", "Ex: 3 anos")}
      {renderField("Região de Atuação", "regiaoAtuacao", "Ex: São Paulo - SP")}
      {renderField("Instagram", "instagramEmpresa", "@empresa")}
      {renderField("Site", "siteEmpresa", "https://...")}
    </div>,

    // Step 1: Financeiro
    <div key={1} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Dados Financeiros</h3>
      {renderField("Faturamento Mensal Atual *", "faturamentoAtual", "Ex: R$ 50.000")}
      {renderField("Meta de Faturamento *", "metaFaturamento", "Ex: R$ 100.000")}
      {renderField("Ticket Médio *", "ticketMedio", "Ex: R$ 150")}
      {renderField("Orçamento para Anúncios", "orcamentoAnuncios", "Ex: R$ 3.000/mês")}
    </div>,

    // Step 2: Produto
    <div key={2} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Produto e Público</h3>
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
      <h3 className="text-lg font-semibold">Análise de Concorrentes</h3>
      {data.concorrentes.map((conc, i) => (
        <div key={i} className="space-y-3 p-4 rounded-lg border border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">Concorrente {i + 1}</p>
            {data.concorrentes.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => set("concorrentes", data.concorrentes.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Input value={conc.nome} onChange={e => setConcorrente(i, "nome", e.target.value)} placeholder="Nome do concorrente" className="bg-background/50 border-border/60" />
          <Input value={conc.pontoForte} onChange={e => setConcorrente(i, "pontoForte", e.target.value)} placeholder="Pontos Fortes" className="bg-background/50 border-border/60" />
          <Input value={conc.pontoFraco} onChange={e => setConcorrente(i, "pontoFraco", e.target.value)} placeholder="Pontos Fracos" className="bg-background/50 border-border/60" />
          <Input value={conc.precoEstimado} onChange={e => setConcorrente(i, "precoEstimado", e.target.value)} placeholder="Preço Estimado" className="bg-background/50 border-border/60" />
          <Input value={conc.siteConcorrente} onChange={e => setConcorrente(i, "siteConcorrente", e.target.value)} placeholder="Site do concorrente" className="bg-background/50 border-border/60" />
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => set("concorrentes", [...data.concorrentes, { nome: "", pontoFraco: "", pontoForte: "", precoEstimado: "", siteConcorrente: "" }])} className="gap-1">
        <Plus className="h-3 w-3" /> Adicionar Concorrente
      </Button>
    </div>,

    // Step 4: Operacional
    <div key={4} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Operacional</h3>
      {renderField("Equipe de Vendas", "equipeVendas", "Ex: 5 vendedores + 1 gerente")}
      {renderField("Ferramentas Utilizadas", "ferramentas", "CRM, email marketing, etc.", true)}
      {renderField("Principal Gargalo *", "gargalo", "Maior dificuldade operacional", true)}
      {renderArrayField("Objeções Frequentes dos Clientes", "objecoes", "Objeção")}
      {renderField("Tom de Voz da Marca *", "tomDeVoz", "Ex: Profissional mas acessível, direto e confiante")}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/80">Canais de Atendimento</Label>
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
      <h3 className="text-lg font-semibold">Mídia e Marca</h3>
      {renderField("Objetivo da Campanha", "objetivoCampanha", "Ex: Gerar leads qualificados para vendas")}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/80">Plataformas de Anúncio</Label>
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
        <Label className="text-sm font-medium text-foreground/80">Já investe em anúncios?</Label>
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
      <h3 className="text-lg font-semibold">Revisão e Confirmação</h3>
      <div className="space-y-2 rounded-lg border border-border/40 p-4 bg-muted/20">
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
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Ao enviar, nossa equipe irá analisar o briefing e iniciar a geração dos documentos estratégicos.
      </p>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Briefing Estratégico</h1>
            <p className="text-xs text-muted-foreground">Preencha para receber seu pacote personalizado</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Etapa {step + 1} de {stepNames.length}</p>
            <p className="text-sm font-semibold text-primary">{stepNames[step]}</p>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          {steps[step]}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
          {step < 6 ? (
            <Button onClick={next} className="gap-2">
              Próximo <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Briefing <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
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
