import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}

/** Reusable upload field for finance attachments (receipts, invoices). */
export function AttachmentUpload({ value, onChange, folder = "transactions" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) return toast.error("Arquivo muito grande (máx 10MB)");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("finance-attachments").upload(path, file);
      if (error) throw error;
      const { data: pub } = supabase.storage.from("finance-attachments").getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success("Anexo enviado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    const fileName = value.split("/").pop()?.split("?")[0] || "anexo";
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
        <Paperclip className="h-4 w-4 text-primary shrink-0" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-sm text-foreground hover:text-primary truncate inline-flex items-center gap-1"
        >
          {fileName} <ExternalLink className="h-3 w-3" />
        </a>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-center border-dashed"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
        ) : (
          <><Paperclip className="mr-2 h-4 w-4" />Anexar comprovante</>
        )}
      </Button>
    </>
  );
}
