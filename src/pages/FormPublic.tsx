import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { FormField } from "@/lib/form-field-types";
import FormRenderer from "@/components/forms/FormRenderer";

function getSessionId(): string {
  const key = "form_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function trackEvent(formId: string, eventType: string) {
  supabase.from("form_events").insert({
    form_id: formId,
    event_type: eventType,
    session_id: getSessionId(),
  }).then(() => {});
}

export default function FormPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const viewTracked = useRef(false);
  const startTracked = useRef(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("forms").select("*").eq("slug", slug).eq("status", "published").single()
      .then(({ data }) => {
        if (data) {
          setForm(data);
          // Track view once
          if (!viewTracked.current) {
            viewTracked.current = true;
            trackEvent(data.id, "view");
          }
        }
        setLoading(false);
      });
  }, [slug]);

  const handleFormStart = useCallback(() => {
    if (!startTracked.current && form) {
      startTracked.current = true;
      trackEvent(form.id, "start");
    }
  }, [form]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Formulário não encontrado</p></div>;

  const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
  const settings = typeof form.settings === "object" && form.settings ? form.settings : {};

  const handleSubmit = async (data: Record<string, any>) => {
    await supabase.from("form_submissions").insert({ form_id: form.id, data });

    // Track submit event
    trackEvent(form.id, "submit");

    // Fire webhook in background (non-blocking)
    if (settings.webhookUrl) {
      supabase.functions.invoke("form-webhook", {
        body: { form_id: form.id, submission_data: data },
      }).catch(err => console.warn("Webhook error:", err));
    }

    if (settings.redirectUrl) {
      window.location.href = settings.redirectUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background" onClick={handleFormStart} onFocus={handleFormStart}>
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
