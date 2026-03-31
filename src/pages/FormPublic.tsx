import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, Send, ArrowRight, ArrowLeft } from "lucide-react";
import { FormField } from "@/lib/form-field-types";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Separator } from "@/components/ui/separator";

export default function FormPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chatStep, setChatStep] = useState(0);
  const [stepperStep, setStepperStep] = useState(0);

  useEffect(() => {
    if (!slug) return;
    supabase.from("forms").select("*").eq("slug", slug).eq("status", "published").single()
      .then(({ data, error }) => {
        if (data) setForm(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!form) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Formulário não encontrado</p></div>;

  const fields: FormField[] = Array.isArray(form.fields) ? form.fields : [];
  const settings = typeof form.settings === "object" && form.settings ? form.settings : {};
  const inputFields = fields.filter(f => !["heading", "paragraph", "divider", "spacer"].includes(f.type));
  const buttonColor = (settings as any).buttonColor || undefined;

  const setValue = (id: string, val: any) => setValues(v => ({ ...v, [id]: val }));

  const validate = () => {
    const errs: Record<string, string> = {};
    inputFields.forEach(f => {
      if (f.required && (!values[f.id] || (typeof values[f.id] === "string" && !values[f.id].trim()))) {
        errs[f.id] = "Campo obrigatório";
      }
      if (f.type === "email" && values[f.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.id])) {
        errs[f.id] = "Email inválido";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const data: Record<string, any> = {};
    inputFields.forEach(f => { data[f.label] = values[f.id] ?? ""; });
    await supabase.from("form_submissions").insert({ form_id: form.id, data });
    setSubmitting(false);
    if ((settings as any).redirectUrl) {
      window.location.href = (settings as any).redirectUrl;
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">{(settings as any).successMessage || "Obrigado!"}</h2>
          <p className="text-muted-foreground">Sua resposta foi enviada com sucesso.</p>
        </div>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const error = errors[field.id];

    switch (field.type) {
      case "heading":
        return <h2 className="text-xl font-bold pt-2">{field.label}</h2>;
      case "paragraph":
        return <p className="text-sm text-muted-foreground">{field.label}</p>;
      case "divider":
        return <Separator />;
      case "spacer":
        return <div className="h-6" />;
      case "short_text":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "long_text":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Textarea value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "email":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input type="email" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "phone":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input type="tel" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "number":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input type="number" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "date":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input type="date" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "select":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Select value={values[field.id] || ""} onValueChange={v => setValue(field.id, v)}>
              <SelectTrigger><SelectValue placeholder={field.placeholder || "Selecione"} /></SelectTrigger>
              <SelectContent>
                {(field.options || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "radio":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <RadioGroup value={values[field.id] || ""} onValueChange={v => setValue(field.id, v)} className="mt-2 space-y-2">
              {(field.options || []).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                  <Label htmlFor={`${field.id}-${opt}`} className="font-normal">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "checkbox":
      case "selection":
        const checked: string[] = values[field.id] || [];
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="mt-2 space-y-2">
              {(field.options || []).map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    checked={checked.includes(opt)}
                    onCheckedChange={v => {
                      if (v) setValue(field.id, [...checked, opt]);
                      else setValue(field.id, checked.filter(c => c !== opt));
                    }}
                  />
                  <Label className="font-normal">{opt}</Label>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "yes_no":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="flex gap-2 mt-2">
              {(field.options || ["Sim", "Não"]).map(opt => (
                <Button
                  key={opt}
                  type="button"
                  variant={values[field.id] === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setValue(field.id, opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "switch":
        return (
          <div className="flex items-center gap-3">
            <Switch checked={values[field.id] || false} onCheckedChange={v => setValue(field.id, v)} />
            <Label>{field.label}</Label>
          </div>
        );
      case "file":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input type="file" onChange={e => setValue(field.id, e.target.files?.[0]?.name || "")} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  // Chat mode layout
  if (form.layout === "chat") {
    const chatFields = fields.filter(f => !["heading", "paragraph", "divider", "spacer"].includes(f.type));
    const currentField = chatFields[chatStep];
    const isLast = chatStep >= chatFields.length - 1;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-xl font-bold text-center">{form.name}</h1>
          <p className="text-xs text-center text-muted-foreground">{chatStep + 1} de {chatFields.length}</p>
          {currentField && (
            <div className="animate-fade-in space-y-4">
              {renderField(currentField)}
              <div className="flex gap-2">
                {chatStep > 0 && (
                  <Button variant="outline" onClick={() => setChatStep(s => s - 1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                )}
                <Button
                  className="flex-1"
                  style={buttonColor ? { backgroundColor: buttonColor } : undefined}
                  onClick={() => {
                    if (isLast) handleSubmit();
                    else setChatStep(s => s + 1);
                  }}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isLast ? (
                    <><Send className="h-4 w-4 mr-1" /> Enviar</>
                  ) : (
                    <><ArrowRight className="h-4 w-4 mr-1" /> Próximo</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Stepper layout
  if (form.layout === "stepper") {
    const stepSize = 3;
    const totalSteps = Math.ceil(fields.length / stepSize);
    const currentFields = fields.slice(stepperStep * stepSize, (stepperStep + 1) * stepSize);
    const isLast = stepperStep >= totalSteps - 1;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-6">
          <h1 className="text-xl font-bold text-center">{form.name}</h1>
          <StepIndicator steps={Array.from({ length: totalSteps }, (_, i) => `Etapa ${i + 1}`)} currentStep={stepperStep} />
          <div className="space-y-4">
            {currentFields.map(f => <div key={f.id}>{renderField(f)}</div>)}
          </div>
          <div className="flex gap-2">
            {stepperStep > 0 && <Button variant="outline" onClick={() => setStepperStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
            <Button
              className="flex-1"
              style={buttonColor ? { backgroundColor: buttonColor } : undefined}
              onClick={() => { if (isLast) handleSubmit(); else setStepperStep(s => s + 1); }}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isLast ? <><Send className="h-4 w-4 mr-1" /> Enviar</> : <><ArrowRight className="h-4 w-4 mr-1" /> Próximo</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card layout
  if (form.layout === "card") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-4">
          <h1 className="text-xl font-bold text-center">{form.name}</h1>
          {fields.map(f => (
            <div key={f.id} className="rounded-xl border bg-card p-4 shadow-sm">{renderField(f)}</div>
          ))}
          <Button className="w-full" style={buttonColor ? { backgroundColor: buttonColor } : undefined} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Enviar</>}
          </Button>
        </div>
      </div>
    );
  }

  // Inline layout
  if (form.layout === "inline") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl space-y-4">
          <h1 className="text-xl font-bold text-center">{form.name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.id} className={f.width === "half" ? "" : "md:col-span-2"}>{renderField(f)}</div>
            ))}
          </div>
          <Button className="w-full" style={buttonColor ? { backgroundColor: buttonColor } : undefined} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Enviar</>}
          </Button>
        </div>
      </div>
    );
  }

  // Default: List layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-4">
        <h1 className="text-xl font-bold text-center">{form.name}</h1>
        {form.description && <p className="text-sm text-muted-foreground text-center">{form.description}</p>}
        <div className="space-y-4">
          {fields.map(f => <div key={f.id}>{renderField(f)}</div>)}
        </div>
        <Button className="w-full" style={buttonColor ? { backgroundColor: buttonColor } : undefined} onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Enviar</>}
        </Button>
      </div>
    </div>
  );
}
