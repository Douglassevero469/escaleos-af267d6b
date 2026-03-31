import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Inbox } from "lucide-react";

interface Props {
  formId: string;
}

export default function FormSubmissions({ formId }: Props) {
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");

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
  });

  const filtered = filter === "all"
    ? submissions
    : submissions.filter((s: any) => (s.status || "complete") === filter);

  const allKeys = Array.from(
    new Set(filtered.flatMap((s: any) => Object.keys(typeof s.data === "object" && s.data ? s.data : {})))
  );

  const completeCount = submissions.filter((s: any) => (s.status || "complete") === "complete").length;
  const incompleteCount = submissions.filter((s: any) => s.status === "incomplete").length;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Data", "Status", ...allKeys];
    const rows = filtered.map((s: any) => {
      const d = typeof s.data === "object" && s.data ? s.data : {};
      return [
        new Date(s.created_at).toLocaleString("pt-BR"),
        (s.status || "complete") === "complete" ? "Completo" : "Incompleto",
        ...allKeys.map(k => (d as any)[k] ?? ""),
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respostas-${formId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!submissions.length) {
    return (
      <GlassCard className="flex flex-col items-center py-16 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma resposta ainda</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
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
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>
      <GlassCard className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              {allKeys.map(k => <TableHead key={k}>{k}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s: any) => {
              const d = typeof s.data === "object" && s.data ? s.data : {};
              const isComplete = (s.status || "complete") === "complete";
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(s.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}>
                      {isComplete ? "Completo" : "Incompleto"}
                    </Badge>
                  </TableCell>
                  {allKeys.map(k => (
                    <TableCell key={k} className="text-sm">{String((d as any)[k] ?? "")}</TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}
