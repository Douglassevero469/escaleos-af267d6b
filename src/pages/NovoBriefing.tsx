import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { ArrowLeft, ArrowRight, Send, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const stepNames = ["Identidade", "Financeiro", "Produto", "Concorrentes", "Operacional", "Mídia", "Revisão"];

export default function NovoBriefing() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key: string, value: string) => setData(prev => ({ ...prev, [key]: value }));

  const next = () => step < 6 && setStep(s => s + 1);
  const prev = () => step > 0 && setStep(s => s - 1);

  const submit = () => {
    toast({ title: "Briefing enviado!", description: "Seu pacote está sendo gerado." });
    navigate("/pacote/1");
  };

  const Field = ({ label, field, placeholder, textarea }: { label: string; field: string; placeholder?: string; textarea?: boolean }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={data[field] || ""} onChange={e => update(field, e.target.value)} placeholder={placeholder} className="bg-muted/50 min-h-[80px]" />
      ) : (
        <Input value={data[field] || ""} onChange={e => update(field, e.target.value)} placeholder={placeholder} className="bg-muted/50" />
      )}
    </div>
  );

  const steps = [
    // Step 0: Identidade
    <div key={0} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Identidade do Negócio</h3>
      <Field label="Nome da Empresa" field="nome" placeholder="Ex: Studio Fitness Prime" />
      <Field label="Nicho / Segmento" field="nicho" placeholder="Ex: Academia, Personal Trainer" />
      <Field label="Instagram" field="instagram" placeholder="@empresa" />
      <Field label="Site" field="site" placeholder="https://..." />
      <Field label="Tempo de Mercado" field="tempo" placeholder="Ex: 3 anos" />
    </div>,
    // Step 1: Financeiro
    <div key={1} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Dados Financeiros</h3>
      <Field label="Faturamento Mensal Atual" field="faturamento" placeholder="Ex: R$ 50.000" />
      <Field label="Meta de Faturamento" field="meta" placeholder="Ex: R$ 100.000" />
      <Field label="Ticket Médio" field="ticket" placeholder="Ex: R$ 150" />
      <Field label="Orçamento para Ads" field="ads" placeholder="Ex: R$ 3.000/mês" />
    </div>,
    // Step 2: Produto
    <div key={2} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Produto e Público</h3>
      <Field label="Produto/Serviço Principal" field="produto" placeholder="Descreva seu produto" />
      <Field label="Faixa de Preço" field="preco" placeholder="Ex: R$ 99 - R$ 299" />
      <Field label="Perfil do Cliente Ideal" field="perfil" placeholder="Idade, gênero, localização..." textarea />
      <Field label="Dores do Cliente" field="dores" placeholder="Principais problemas que resolve" textarea />
      <Field label="Desejos do Cliente" field="desejos" placeholder="O que o cliente deseja alcançar" textarea />
    </div>,
    // Step 3: Concorrentes
    <div key={3} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Análise de Concorrentes</h3>
      {[1, 2, 3].map(n => (
        <GlassCard key={n} className="space-y-3 p-4">
          <p className="text-sm font-medium text-muted-foreground">Concorrente {n}</p>
          <Field label="Nome" field={`conc${n}_nome`} placeholder="Nome do concorrente" />
          <Field label="Pontos Fortes" field={`conc${n}_fortes`} placeholder="O que fazem bem" />
          <Field label="Pontos Fracos" field={`conc${n}_fracos`} placeholder="Onde falham" />
          <Field label="Preço" field={`conc${n}_preco`} placeholder="Faixa de preço" />
        </GlassCard>
      ))}
    </div>,
    // Step 4: Operacional
    <div key={4} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Operacional</h3>
      <Field label="Tamanho da Equipe" field="equipe" placeholder="Ex: 5 pessoas" />
      <Field label="Ferramentas Utilizadas" field="ferramentas" placeholder="CRM, email, etc." textarea />
      <Field label="Principal Gargalo" field="gargalo" placeholder="Maior dificuldade operacional" textarea />
      <Field label="Objeções Comuns dos Clientes" field="objecoes" placeholder="O que os clientes costumam questionar" textarea />
      <Field label="Tom de Voz da Marca" field="tom" placeholder="Ex: Profissional mas acessível" />
    </div>,
    // Step 5: Mídia
    <div key={5} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Mídia e Marca</h3>
      <Field label="Plataformas Ativas" field="plataformas" placeholder="Instagram, Google, TikTok..." />
      <Field label="Investimento em Marketing" field="investimento" placeholder="Ex: R$ 5.000/mês" />
      <Field label="Cores da Marca" field="cores" placeholder="Ex: Azul marinho, dourado" />
      <Field label="Prova Social" field="prova" placeholder="Depoimentos, cases, números" textarea />
    </div>,
    // Step 6: Revisão
    <div key={6} className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold">Revisão e Confirmação</h3>
      <GlassCard className="space-y-3">
        {Object.entries(data).filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-sm py-1 border-b border-border/30 last:border-0">
            <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
            <span className="text-right font-medium max-w-[60%] truncate">{v}</span>
          </div>
        ))}
        {Object.keys(data).filter(k => data[k]).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado preenchido ainda.</p>
        )}
      </GlassCard>
      <GlassCard className="flex items-center gap-3 p-4">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Upload de Arquivo</p>
          <p className="text-xs text-muted-foreground">Importe briefing em YAML, JSON, PDF ou DOCX</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto">Importar</Button>
      </GlassCard>
    </div>,
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Novo Briefing</h1>
        <p className="text-sm text-muted-foreground">Preencha as informações do cliente</p>
      </div>

      <StepIndicator steps={stepNames} currentStep={step} />

      <GlassCard>{steps[step]}</GlassCard>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        {step < 6 ? (
          <Button onClick={next} className="gap-2">
            Próximo <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} className="gap-2">
            Gerar Pacote <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
