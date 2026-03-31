export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  width?: "full" | "half";
  validations?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export const FIELD_TYPES = [
  { type: "short_text", label: "Texto Curto", icon: "Type" },
  { type: "long_text", label: "Texto Longo", icon: "AlignLeft" },
  { type: "email", label: "Email", icon: "Mail" },
  { type: "phone", label: "Telefone", icon: "Phone" },
  { type: "number", label: "Número", icon: "Hash" },
  { type: "select", label: "Select / Dropdown", icon: "ChevronDown" },
  { type: "checkbox", label: "Checkbox", icon: "CheckSquare" },
  { type: "radio", label: "Radio", icon: "Circle" },
  { type: "switch", label: "Switch", icon: "ToggleLeft" },
  { type: "yes_no", label: "Sim ou Não", icon: "ThumbsUp" },
  { type: "selection", label: "Seleção Múltipla", icon: "List" },
  { type: "date", label: "Data", icon: "Calendar" },
  { type: "file", label: "Upload de Arquivo", icon: "Upload" },
  { type: "heading", label: "Título / Heading", icon: "Heading" },
  { type: "paragraph", label: "Parágrafo", icon: "FileText" },
  { type: "divider", label: "Divisor", icon: "Minus" },
  { type: "spacer", label: "Espaçador", icon: "MoveVertical" },
] as const;

export function createField(type: string): FormField {
  const id = crypto.randomUUID();
  const fieldDef = FIELD_TYPES.find(f => f.type === type);
  const label = fieldDef?.label || type;

  const base: FormField = { id, type, label, width: "full" };

  switch (type) {
    case "email":
      return { ...base, placeholder: "email@exemplo.com", required: true };
    case "phone":
      return { ...base, placeholder: "(00) 00000-0000" };
    case "select":
    case "radio":
    case "selection":
      return { ...base, options: ["Opção 1", "Opção 2", "Opção 3"] };
    case "checkbox":
      return { ...base, options: ["Opção 1", "Opção 2"] };
    case "yes_no":
      return { ...base, options: ["Sim", "Não"] };
    case "heading":
      return { ...base, label: "Título da Seção" };
    case "paragraph":
      return { ...base, label: "Texto descritivo aqui..." };
    default:
      return base;
  }
}
