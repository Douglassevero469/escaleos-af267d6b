import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SubmissionsDialog from "@/components/forms/SubmissionsDialog";
import { Loader2 } from "lucide-react";

export default function FormSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: form, isLoading } = useQuery({
    queryKey: ["form-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("id, name")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SubmissionsDialog
      formId={form.id}
      formName={form.name}
      open={true}
      onOpenChange={(open) => {
        if (!open) navigate("/forms");
      }}
    />
  );
}
