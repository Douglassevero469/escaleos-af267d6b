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

function trackEvent(formId: string, eventType: string, metadata?: Record<string, any>) {
  supabase.from("form_events").insert({
    form_id: formId,
    event_type: eventType,
    session_id: getSessionId(),
    metadata: metadata || {},
  }).then(() => {});
}

export default function FormPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const viewTracked = useRef(false);
  const startTracked = useRef(false);
  const submittedRef = useRef(false);
  const lastFieldRef = useRef<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("forms").select("*").eq("slug", slug).eq("status", "published").single()
      .then(({ data }) => {
        if (data) {
          setForm(data);
          if (!viewTracked.current) {
            viewTracked.current = true;
            trackEvent(data.id, "view");
          }
        }
        setLoading(false);
      });
  }, [slug]);

  // Track abandonment on page leave
  useEffect(() => {
    if (!form) return;
    const handleBeforeUnload = () => {
      if (!submittedRef.current && lastFieldRef.current) {
        trackEvent(form.id, "abandon", {
          last_field_id: lastFieldRef.current.id,
          last_field_label: lastFieldRef.current.label,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form]);

  const handleFormStart = useCallback(() => {
    if (!startTracked.current && form) {
      startTracked.current = true;
      trackEvent(form.id, "start");
    }
  }, [form]);

  const handleFieldFocus = useCallback((fieldId: string, fieldLabel: string) => {
    if (!form) return;
    lastFieldRef.current = { id: fieldId, label: fieldLabel };
    trackEvent(form.id, "field_focus", { field_id: fieldId, field_label: fieldLabel });
  }, [form]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Formulário não encontrado</p></div>;

  const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
  const settings = typeof form.settings === "object" && form.settings ? form.settings : {};

  const handleSubmit = async (data: Record<string, any>) => {
    submittedRef.current = true;
    await supabase.from("form_submissions").insert({ form_id: form.id, data });
    trackEvent(form.id, "submit");

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
    <div className="min-h-screen" onClick={handleFormStart} onFocus={handleFormStart}>
      <FormRenderer
        formName={form.name}
        formDescription={form.description}
        layout={form.layout}
        fields={fields}
        settings={settings}
        onSubmit={handleSubmit}
        onFieldFocus={handleFieldFocus}
      />
    </div>
  );
}
