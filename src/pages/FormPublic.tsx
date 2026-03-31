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
  const currentValuesRef = useRef<Record<string, any>>({});
  const fieldsRef = useRef<FormField[]>([]);

  useEffect(() => {
    if (!slug) return;
    supabase.from("forms").select("*").eq("slug", slug).eq("status", "published").single()
      .then(({ data }) => {
        if (data) {
          setForm(data);
          fieldsRef.current = Array.isArray(data.fields) ? (data.fields as unknown as FormField[]) : [];
          if (!viewTracked.current) {
            viewTracked.current = true;
            trackEvent(data.id, "view");
          }
        }
        setLoading(false);
      });
  }, [slug]);

  // Save partial data on page leave (abandonment)
  useEffect(() => {
    if (!form) return;
    const handleBeforeUnload = () => {
      if (submittedRef.current) return;

      // Build labeled data from current values
      const rawValues = currentValuesRef.current;
      const hasData = Object.values(rawValues).some(v =>
        v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
      );

      if (hasData) {
        const data: Record<string, any> = {};
        const inputFields = fieldsRef.current.filter(
          f => !["heading", "paragraph", "divider", "spacer"].includes(f.type)
        );
        inputFields.forEach(f => {
          if (rawValues[f.id] !== undefined && rawValues[f.id] !== "" && rawValues[f.id] !== null) {
            data[f.label] = rawValues[f.id];
          }
        });

        if (Object.keys(data).length > 0) {
          // Use fetch with keepalive for reliable delivery on page unload
          const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/form_submissions`;
          const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          fetch(url, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              "apikey": anonKey,
              "Authorization": `Bearer ${anonKey}`,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ form_id: form.id, data, status: "incomplete" }),
          }).catch(() => {});
        }
      }

      // Also track abandonment event
      if (lastFieldRef.current) {
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

  const handleValuesChange = useCallback((values: Record<string, any>) => {
    currentValuesRef.current = values;
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">Formulário não encontrado</p></div>;

  const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
  const settings = typeof form.settings === "object" && form.settings ? form.settings : {};

  const handleSubmit = async (data: Record<string, any>) => {
    submittedRef.current = true;
    await supabase.from("form_submissions").insert({ form_id: form.id, data, status: "complete" });
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
        onValuesChange={handleValuesChange}
      />
    </div>
  );
}
