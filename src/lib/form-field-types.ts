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
    min?: number;
    max?: number;
  };
}

export const FIELD_TYPE_CATEGORIES = [
  {
    category: "Texto",
    types: [
      { type: "short_text", label: "Texto Curto", icon: "Type" },
      { type: "long_text", label: "Texto Longo", icon: "AlignLeft" },
      { type: "email", label: "Email", icon: "Mail" },
      { type: "phone", label: "Telefone", icon: "Phone" },
      { type: "url", label: "URL / Link", icon: "Link" },
      { type: "cpf", label: "CPF", icon: "Fingerprint" },
    ],
  },
  {
    category: "Numérico",
    types: [
      { type: "number", label: "Número", icon: "Hash" },
      { type: "currency", label: "Moeda (R$)", icon: "DollarSign" },
      { type: "rating", label: "Avaliação (Estrelas)", icon: "Star" },
      { type: "slider", label: "Slider / Range", icon: "SlidersHorizontal" },
    ],
  },
  {
    category: "Seleção",
    types: [
      { type: "select", label: "Dropdown (única)", icon: "ChevronDown" },
      { type: "radio", label: "Radio (única)", icon: "Circle" },
      { type: "radio_cards", label: "Cards (única)", icon: "LayoutGrid" },
      { type: "checkbox", label: "Checkbox (múltipla)", icon: "CheckSquare" },
      { type: "selection", label: "Chips (múltipla)", icon: "List" },
      { type: "image_choice", label: "Seleção c/ Imagem", icon: "ImageIcon" },
      { type: "yes_no", label: "Sim ou Não", icon: "ThumbsUp" },
      { type: "switch", label: "Switch", icon: "ToggleLeft" },
    ],
  },
  {
    category: "Data & Hora",
    types: [
      { type: "date", label: "Data", icon: "Calendar" },
      { type: "time", label: "Hora", icon: "Clock" },
      { type: "datetime", label: "Data e Hora", icon: "CalendarClock" },
    ],
  },
  {
    category: "Mídia",
    types: [
      { type: "file", label: "Upload de Arquivo", icon: "Upload" },
    ],
  },
  {
    category: "Layout",
    types: [
      { type: "heading", label: "Título / Heading", icon: "Heading" },
      { type: "paragraph", label: "Parágrafo", icon: "FileText" },
      { type: "divider", label: "Divisor", icon: "Minus" },
      { type: "spacer", label: "Espaçador", icon: "MoveVertical" },
    ],
  },
];

// Flat list for backwards compat
export const FIELD_TYPES = FIELD_TYPE_CATEGORIES.flatMap(c => c.types);

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
    case "url":
      return { ...base, placeholder: "https://..." };
    case "cpf":
      return { ...base, placeholder: "000.000.000-00" };
    case "currency":
      return { ...base, placeholder: "0,00" };
    case "select":
    case "radio":
    case "radio_cards":
    case "selection":
    case "image_choice":
      return { ...base, options: ["Opção 1", "Opção 2", "Opção 3"] };
    case "checkbox":
      return { ...base, options: ["Opção 1", "Opção 2"] };
    case "yes_no":
      return { ...base, options: ["Sim", "Não"] };
    case "rating":
      return { ...base, validations: { max: 5 } };
    case "slider":
      return { ...base, validations: { min: 0, max: 100 } };
    case "heading":
      return { ...base, label: "Título da Seção" };
    case "paragraph":
      return { ...base, label: "Texto descritivo aqui..." };
    default:
      return base;
  }
}
