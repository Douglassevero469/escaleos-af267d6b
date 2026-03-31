import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Package, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const mockClients = [
  { id: "1", name: "Studio Fitness Prime", nicho: "Academia", pacotes: 3, lastDate: "28 Mar 2026" },
  { id: "2", name: "Clínica Estética Bella", nicho: "Estética", pacotes: 2, lastDate: "25 Mar 2026" },
  { id: "3", name: "Tech Solutions LTDA", nicho: "Tecnologia", pacotes: 1, lastDate: "22 Mar 2026" },
  { id: "4", name: "Restaurante Sabor & Arte", nicho: "Alimentação", pacotes: 4, lastDate: "20 Mar 2026" },
  { id: "5", name: "Imobiliária Viva", nicho: "Imóveis", pacotes: 2, lastDate: "18 Mar 2026" },
  { id: "6", name: "Pet Shop Amigo Fiel", nicho: "Pet", pacotes: 1, lastDate: "15 Mar 2026" },
];

export default function Clientes() {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nicho.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{mockClients.length} clientes cadastrados</p>
        </div>
        <Link to="/briefing/novo">
          <Button className="gap-2">Novo Briefing <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou nicho..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-muted/50"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(client => (
          <Link key={client.id} to={`/clientes/${client.id}/pacotes`}>
            <GlassCard className="hover-scale cursor-pointer space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.nicho}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {client.pacotes} pacotes</span>
                <span>{client.lastDate}</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
