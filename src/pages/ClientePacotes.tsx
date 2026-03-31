import { GlassCard } from "@/components/ui/GlassCard";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ClientePacotes() {
  const { id } = useParams();

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: pacotes = [], isLoading } = useQuery({
    queryKey: ["client-packages", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("packages")
        .select("*, documents(id)")
        .eq("client_id", id!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Pacotes do Cliente</h1>
        <p className="text-sm text-muted-foreground font-light">{client?.name ?? "..."} · {pacotes.length} pacotes gerados</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : pacotes.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum pacote gerado para este cliente</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacotes.map((p: any) => (
            <Link key={p.id} to={`/pacote/${p.id}`}>
              <GlassCard className="hover-scale cursor-pointer space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {p.status === "ready" ? "pronto" : p.status}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Pacote</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")} · {p.documents?.length ?? 0} docs</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary">
                  Ver documentos <ArrowRight className="h-3 w-3" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
