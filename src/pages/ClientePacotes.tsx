import { GlassCard } from "@/components/ui/GlassCard";
import { Package, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const mockPacotes = [
  { id: "1", date: "28 Mar 2026", docs: 8, status: "pronto" },
  { id: "2", date: "15 Mar 2026", docs: 8, status: "pronto" },
  { id: "3", date: "02 Mar 2026", docs: 5, status: "gerando" },
];

export default function ClientePacotes() {
  const { id } = useParams();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Pacotes do Cliente</h1>
        <p className="text-sm text-muted-foreground font-light">Cliente #{id} · {mockPacotes.length} pacotes gerados</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPacotes.map(p => (
          <Link key={p.id} to={`/pacote/${p.id}`}>
            <GlassCard className="hover-scale cursor-pointer space-y-3">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "pronto" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {p.status}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">Pacote #{p.id}</p>
                <p className="text-xs text-muted-foreground">{p.date} · {p.docs} docs</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary">
                Ver documentos <ArrowRight className="h-3 w-3" />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
