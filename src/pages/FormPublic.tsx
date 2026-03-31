import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { FormField } from "@/lib/form-field-types";
import FormRenderer from "@/components/forms/FormRenderer";

export default function FormPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("forms").select("*").eq("slug", slug).eq("status", "published").single()
      .then(({ data }) => {
        if (data) setForm(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Formulário não encontrado</p></div>;

  const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
  const settings = typeof form.settings === "object" && form.settings ? form.settings : {};

  const handleSubmit = async (data: Record<string, any>) => {
    await supabase.from("form_submissions").insert({ form_id: form.id, data });
    if (settings.redirectUrl) {
      window.location.href = settings.redirectUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FormRenderer
        formName={form.name}
        formDescription={form.description}
        layout={form.layout}
        fields={fields}
        settings={settings}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
