import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, Inbox } from "lucide-react";

interface Props {
  formId: string;
}

export default function FormSubmissions({ formId }: Props) {
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

  const allKeys = Array.from(
    new Set(submissions.flatMap((s: any) => Object.keys(typeof s.data === "object" && s.data ? s.data : {})))
  );

  const exportCSV = () => {
    if (!submissions.length) return;
    const headers = ["Data", ...allKeys];
    const rows = submissions.map((s: any) => {
      const d = typeof s.data === "object" && s.data ? s.data : {};
      return [new Date(s.created_at).toLocaleString("pt-BR"), ...allKeys.map(k => (d as any)[k] ?? "")];
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{submissions.length} resposta(s)</p>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>
      <GlassCard className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {allKeys.map(k => <TableHead key={k}>{k}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s: any) => {
              const d = typeof s.data === "object" && s.data ? s.data : {};
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(s.created_at).toLocaleString("pt-BR")}</TableCell>
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
