import { GlassCard } from "@/components/ui/GlassCard";
import { StatsCard } from "@/components/ui/StatsCard";
import { Users, Package, FileText, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mockUsers = [
  { id: 1, name: "João Silva", email: "joao@email.com", role: "admin", pacotes: 45, lastLogin: "31 Mar 2026" },
  { id: 2, name: "Maria Santos", email: "maria@email.com", role: "user", pacotes: 23, lastLogin: "30 Mar 2026" },
  { id: 3, name: "Pedro Costa", email: "pedro@email.com", role: "user", pacotes: 12, lastLogin: "28 Mar 2026" },
  { id: 4, name: "Ana Oliveira", email: "ana@email.com", role: "user", pacotes: 34, lastLogin: "29 Mar 2026" },
  { id: 5, name: "Lucas Mendes", email: "lucas@email.com", role: "admin", pacotes: 56, lastLogin: "31 Mar 2026" },
];

export default function Admin() {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel Admin</h1>
        <p className="text-sm text-muted-foreground font-light">Gestão global da plataforma</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Usuários Ativos" value={5} icon={Users} />
        <StatsCard title="Pacotes Total" value={170} icon={Package} />
        <StatsCard title="Documentos" value="1.360" icon={FileText} />
        <StatsCard title="Ações Hoje" value={28} icon={Activity} />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Usuários</h3>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs bg-muted/50"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Pacotes</TableHead>
              <TableHead>Último Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{user.pacotes}</TableCell>
                <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}
