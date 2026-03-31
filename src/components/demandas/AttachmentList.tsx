import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Paperclip, Upload, Trash2, FileText, Image, File, X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Attachment {
  id: string;
  item_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

function getFileIcon(type: string) {
  if (type.startsWith("image")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function isPreviewable(type: string) {
  return type.startsWith("image") || type.includes("pdf");
}

interface AttachmentListProps {
  itemId: string;
  onActivityLog?: (action: string, details: Record<string, any>) => void;
}

export function AttachmentList({ itemId, onActivityLog }: AttachmentListProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAttachments();
  }, [itemId]);

  useEffect(() => {
    if (!preview) setZoom(1);
  }, [preview]);

  const loadAttachments = async () => {
    const { data } = await supabase
      .from("demand_attachments")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false });
    if (data) setAttachments(data as Attachment[]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${user.id}/${itemId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("demand-attachments")
        .upload(path, file);

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("demand-attachments").getPublicUrl(path);

      await supabase.from("demand_attachments").insert({
        item_id: itemId,
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      });

      onActivityLog?.("attachment_added", { title: file.name });
    }
    setUploading(false);
    loadAttachments();
    toast.success("Arquivo(s) enviado(s)!");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (att: Attachment) => {
    await supabase.from("demand_attachments").delete().eq("id", att.id);
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    toast.success("Anexo removido");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" /> Anexos
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Enviando..." : "Enviar"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum anexo.</p>
      ) : (
        <div className="space-y-1">
          {attachments.map(att => {
            const Icon = getFileIcon(att.file_type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 group cursor-pointer"
                onClick={() => isPreviewable(att.file_type) ? setPreview(att) : window.open(att.file_url, "_blank")}
              >
                {att.file_type.startsWith("image") ? (
                  <img src={att.file_url} alt={att.file_name} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs flex-1 truncate">{att.file_name}</span>
                <span className="text-[10px] text-muted-foreground">{formatSize(att.file_size)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(att); }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
          {preview && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <span className="text-sm font-medium truncate max-w-[60%]">{preview.file_name}</span>
                <div className="flex items-center gap-1">
                  {preview.file_type.startsWith("image") && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <a href={preview.file_url} download target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto flex items-center justify-center bg-background/50 p-4">
                {preview.file_type.startsWith("image") ? (
                  <img
                    src={preview.file_url}
                    alt={preview.file_name}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />
                ) : preview.file_type.includes("pdf") ? (
                  <iframe
                    src={preview.file_url}
                    className="w-full h-full rounded border-0"
                    title={preview.file_name}
                  />
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
