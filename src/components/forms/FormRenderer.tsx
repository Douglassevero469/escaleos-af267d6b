import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle2, Send, ArrowRight, ArrowLeft, Star } from "lucide-react";
import { FormField } from "@/lib/form-field-types";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Separator } from "@/components/ui/separator";
import { getFormTheme } from "@/lib/form-themes";

interface FormRendererProps {
  formName: string;
  formDescription?: string;
  layout: string;
  fields: FormField[];
  settings?: Record<string, any>;
  /** If true, submission is disabled and a message is shown instead */
  isPreview?: boolean;
  onSubmit?: (data: Record<string, any>) => Promise<void>;
  /** Called when user focuses a field — used for abandonment tracking */
  onFieldFocus?: (fieldId: string, fieldLabel: string) => void;
  /** Called whenever form values change — used for partial data capture */
  onValuesChange?: (values: Record<string, any>) => void;
}

export default function FormRenderer({
  formName,
  formDescription,
  layout,
  fields,
  settings = {},
  isPreview = false,
  onSubmit,
  onFieldFocus,
  onValuesChange,
}: FormRendererProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chatStep, setChatStep] = useState(0);
  const [stepperStep, setStepperStep] = useState(0);

  const theme = useMemo(() => getFormTheme(settings.theme), [settings.theme]);
  const isGradientBg = theme.vars["--form-bg"].startsWith("linear-gradient");

  const themeStyle: React.CSSProperties = {
    fontFamily: theme.vars["--form-font"],
    color: theme.vars["--form-fg"],
    ...(isGradientBg
      ? { backgroundImage: theme.vars["--form-bg"] }
      : { backgroundColor: theme.vars["--form-bg"] }),
    borderRadius: theme.vars["--form-radius"],
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.vars["--form-input-bg"],
    borderColor: theme.vars["--form-input-border"],
    color: theme.vars["--form-fg"],
    borderRadius: theme.vars["--form-radius"],
  };

  const btnStyle: React.CSSProperties = {
    backgroundColor: settings.buttonColor || theme.vars["--form-accent"],
    color: theme.vars["--form-accent-fg"],
    borderRadius: theme.vars["--form-radius"],
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.vars["--form-card-bg"],
    borderColor: theme.vars["--form-border"],
    borderRadius: theme.vars["--form-radius"],
  };

  const labelStyle: React.CSSProperties = { color: theme.vars["--form-fg"] };
  const mutedStyle: React.CSSProperties = { color: theme.vars["--form-muted"] };

  const inputFields = fields.filter(f => !["heading", "paragraph", "divider", "spacer"].includes(f.type));

  const formHeader = (
    <div className="text-center space-y-3">
      {settings.logoUrl && (
        <img src={settings.logoUrl} alt="Logo" className="h-12 max-w-[180px] object-contain mx-auto" />
      )}
      <h1 className="text-xl font-bold">{formName}</h1>
    </div>
  );

  const setValue = (id: string, val: any) => {
    setValues(v => {
      const next = { ...v, [id]: val };
      onValuesChange?.(next);
      return next;
    });
  };

  const handleFieldFocus = (field: FormField) => {
    if (onFieldFocus) onFieldFocus(field.id, field.label);
  };

  const wrapperHeight = isPreview ? "min-h-[300px]" : "min-h-screen";

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
    if (isPreview) return;
    if (!validate()) return;
    setSubmitting(true);
    const data: Record<string, any> = {};
    inputFields.forEach(f => { data[f.label] = values[f.id] ?? ""; });
    if (onSubmit) await onSubmit(data);
    setSubmitting(false);
    if (settings.redirectUrl && !isPreview) {
      window.location.href = settings.redirectUrl;
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center justify-center p-6 ${wrapperHeight}`} style={themeStyle}>
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">{settings.successMessage || "Obrigado!"}</h2>
          <p className="text-muted-foreground">Sua resposta foi enviada com sucesso.</p>
        </div>
      </div>
    );
  }

  const renderFieldInner = (field: FormField) => {
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
            <Input style={inputStyle} value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "long_text":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Textarea style={inputStyle} value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "email":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="email" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "phone":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="tel" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "number":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="number" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "date":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="date" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "select":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Select value={values[field.id] || ""} onValueChange={v => setValue(field.id, v)}>
              <SelectTrigger style={inputStyle}><SelectValue placeholder={field.placeholder || "Selecione"} /></SelectTrigger>
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
      case "selection": {
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
      }
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
            <Input style={inputStyle} type="file" onChange={e => setValue(field.id, e.target.files?.[0]?.name || "")} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "url":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="url" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} placeholder={field.placeholder} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "cpf":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input
              style={inputStyle}
              value={values[field.id] || ""}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                const formatted = v.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
                  [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
                );
                setValue(field.id, formatted);
              }}
              placeholder={field.placeholder}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "currency":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                className="pl-9"
                value={values[field.id] || ""}
                onChange={e => setValue(field.id, e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder={field.placeholder}
              />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "rating": {
        const maxStars = field.validations?.max || 5;
        const currentRating = values[field.id] || 0;
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: maxStars }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setValue(field.id, i + 1)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${i < currentRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      }
      case "slider": {
        const min = field.validations?.min ?? 0;
        const max = field.validations?.max ?? 100;
        const val = values[field.id] ?? min;
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground w-8 text-right">{min}</span>
              <Slider
                value={[val]}
                min={min}
                max={max}
                step={1}
                onValueChange={([v]) => setValue(field.id, v)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{max}</span>
            </div>
            <p className="text-center text-sm font-medium mt-1">{val}</p>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      }
      case "radio_cards":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(field.options || []).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue(field.id, opt)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium text-left transition-all ${
                    values[field.id] === opt
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "image_choice":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(field.options || []).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue(field.id, opt)}
                  className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                    values[field.id] === opt
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="w-full h-16 rounded bg-muted/50 flex items-center justify-center mb-2 text-muted-foreground text-xs">
                    📷
                  </div>
                  {opt}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "time":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="time" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      case "datetime":
        return (
          <div>
            <Label>{field.label}{field.required && <span className="text-destructive"> *</span>}</Label>
            <Input style={inputStyle} type="datetime-local" value={values[field.id] || ""} onChange={e => setValue(field.id, e.target.value)} />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  const renderField = (field: FormField) => {
    const el = renderFieldInner(field);
    const isInput = !["heading", "paragraph", "divider", "spacer"].includes(field.type);
    if (isInput) {
      return <div onFocusCapture={() => handleFieldFocus(field)}>{el}</div>;
    }
    return el;
  };

  const submitButton = (fullWidth = true) => (
    <Button
      className={fullWidth ? "w-full" : "flex-1"}
      style={btnStyle}
      onClick={isPreview ? undefined : handleSubmit}
      disabled={submitting || isPreview}
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Enviar</>}
    </Button>
  );

  // Chat mode
  if (layout === "chat") {
    const chatFields = fields.filter(f => !["heading", "paragraph", "divider", "spacer"].includes(f.type));
    const currentField = chatFields[chatStep];
    const isLast = chatStep >= chatFields.length - 1;

    return (
      <div className={`flex items-center justify-center p-6 ${wrapperHeight}`} style={themeStyle}>
        <div className="w-full max-w-md space-y-6">
          {formHeader}
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
                  style={btnStyle}
                  onClick={() => {
                    if (isPreview) return;
                    if (isLast) handleSubmit();
                    else setChatStep(s => s + 1);
                  }}
                  disabled={submitting || isPreview}
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

  // Stepper
  if (layout === "stepper") {
    const stepSize = 3;
    const totalSteps = Math.ceil(fields.length / stepSize);
    const currentFields = fields.slice(stepperStep * stepSize, (stepperStep + 1) * stepSize);
    const isLast = stepperStep >= totalSteps - 1;

    return (
      <div className={`flex items-center justify-center p-6 ${wrapperHeight}`} style={themeStyle}>
        <div className="w-full max-w-lg space-y-6">
          {formHeader}
          <StepIndicator steps={Array.from({ length: totalSteps }, (_, i) => `Etapa ${i + 1}`)} currentStep={stepperStep} />
          <div className="space-y-4">
            {currentFields.map(f => <div key={f.id}>{renderField(f)}</div>)}
          </div>
          <div className="flex gap-2">
            {stepperStep > 0 && <Button variant="outline" onClick={() => setStepperStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
            <Button
              className="flex-1"
              style={btnStyle}
              onClick={() => { if (isPreview) return; if (isLast) handleSubmit(); else setStepperStep(s => s + 1); }}
              disabled={submitting || isPreview}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isLast ? <><Send className="h-4 w-4 mr-1" /> Enviar</> : <><ArrowRight className="h-4 w-4 mr-1" /> Próximo</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card
  if (layout === "card") {
    return (
      <div className={`flex items-center justify-center p-6 ${wrapperHeight}`} style={themeStyle}>
        <div className="w-full max-w-lg space-y-4">
          {formHeader}
          {fields.map(f => (
            <div key={f.id} className="rounded-xl border p-4 shadow-sm" style={cardStyle}>{renderField(f)}</div>
          ))}
          {submitButton()}
        </div>
      </div>
    );
  }

  // Inline
  if (layout === "inline") {
    return (
      <div className={`flex items-center justify-center p-6 ${wrapperHeight}`} style={themeStyle}>
        <div className="w-full max-w-2xl space-y-4">
          {formHeader}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.id} className={f.width === "half" ? "" : "md:col-span-2"}>{renderField(f)}</div>
            ))}
          </div>
          {submitButton()}
        </div>
      </div>
    );
  }

  // Default: List
  return (
    <div className={`flex items-center justify-center p-6 ${wrapperHeight}`} style={themeStyle}>
      <div className="w-full max-w-lg space-y-4">
        {formHeader}
        {formDescription && <p className="text-sm text-center" style={mutedStyle}>{formDescription}</p>}
        <div className="space-y-4">
          {fields.map(f => <div key={f.id}>{renderField(f)}</div>)}
        </div>
        {submitButton()}
      </div>
    </div>
  );
}
