import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTemplates = [
  { id: 1, name: "Template Academia", desc: "Modelo otimizado para academias e personal trainers", uses: 12 },
  { id: 2, name: "Template Clínica Estética", desc: "Focado em clínicas de estética e dermatologia", uses: 8 },
  { id: 3, name: "Template E-commerce", desc: "Para lojas online e dropshipping", uses: 15 },
  { id: 4, name: "Template Restaurante", desc: "Modelo para restaurantes e delivery", uses: 6 },
  { id: 5, name: "Template SaaS", desc: "Para empresas de software como serviço", uses: 20 },
  { id: 6, name: "Template Imobiliária", desc: "Focado em corretores e imobiliárias", uses: 4 },
];

export default function Templates() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground font-light">{mockTemplates.length} templates disponíveis</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Template</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map(t => (
          <GlassCard key={t.id} className="hover-scale space-y-3">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{t.uses} usos</span>
            </div>
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Copy className="h-3 w-3" /> Usar Template
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
