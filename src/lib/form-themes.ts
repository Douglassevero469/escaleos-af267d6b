export interface FormTheme {
  id: string;
  label: string;
  preview: string; // CSS gradient for the theme picker swatch
  vars: {
    "--form-bg": string;
    "--form-fg": string;
    "--form-muted": string;
    "--form-border": string;
    "--form-input-bg": string;
    "--form-input-border": string;
    "--form-card-bg": string;
    "--form-accent": string;
    "--form-accent-fg": string;
    "--form-radius": string;
    "--form-font": string;
  };
}

export const FORM_THEMES: FormTheme[] = [
  {
    id: "light",
    label: "Claro",
    preview: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    vars: {
      "--form-bg": "#ffffff",
      "--form-fg": "#0f172a",
      "--form-muted": "#64748b",
      "--form-border": "#e2e8f0",
      "--form-input-bg": "#ffffff",
      "--form-input-border": "#cbd5e1",
      "--form-card-bg": "#f8fafc",
      "--form-accent": "#2563eb",
      "--form-accent-fg": "#ffffff",
      "--form-radius": "0.5rem",
      "--form-font": "'Inter', system-ui, sans-serif",
    },
  },
  {
    id: "dark",
    label: "Escuro",
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    vars: {
      "--form-bg": "#0f172a",
      "--form-fg": "#f1f5f9",
      "--form-muted": "#94a3b8",
      "--form-border": "#334155",
      "--form-input-bg": "#1e293b",
      "--form-input-border": "#475569",
      "--form-card-bg": "#1e293b",
      "--form-accent": "#3b82f6",
      "--form-accent-fg": "#ffffff",
      "--form-radius": "0.5rem",
      "--form-font": "'Inter', system-ui, sans-serif",
    },
  },
  {
    id: "minimal",
    label: "Minimalista",
    preview: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
    vars: {
      "--form-bg": "#fafafa",
      "--form-fg": "#171717",
      "--form-muted": "#a3a3a3",
      "--form-border": "#e5e5e5",
      "--form-input-bg": "#ffffff",
      "--form-input-border": "#d4d4d4",
      "--form-card-bg": "#ffffff",
      "--form-accent": "#171717",
      "--form-accent-fg": "#ffffff",
      "--form-radius": "0.25rem",
      "--form-font": "'Inter', system-ui, sans-serif",
    },
  },
  {
    id: "colorful",
    label: "Colorido",
    preview: "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)",
    vars: {
      "--form-bg": "linear-gradient(135deg, #ede9fe 0%, #dbeafe 50%, #cffafe 100%)",
      "--form-fg": "#1e1b4b",
      "--form-muted": "#6366f1",
      "--form-border": "#c7d2fe",
      "--form-input-bg": "rgba(255,255,255,0.8)",
      "--form-input-border": "#a5b4fc",
      "--form-card-bg": "rgba(255,255,255,0.6)",
      "--form-accent": "#7c3aed",
      "--form-accent-fg": "#ffffff",
      "--form-radius": "0.75rem",
      "--form-font": "'Inter', system-ui, sans-serif",
    },
  },
  {
    id: "warm",
    label: "Quente",
    preview: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)",
    vars: {
      "--form-bg": "#fffbeb",
      "--form-fg": "#451a03",
      "--form-muted": "#92400e",
      "--form-border": "#fde68a",
      "--form-input-bg": "#ffffff",
      "--form-input-border": "#fcd34d",
      "--form-card-bg": "#fef9c3",
      "--form-accent": "#d97706",
      "--form-accent-fg": "#ffffff",
      "--form-radius": "0.5rem",
      "--form-font": "'Inter', system-ui, sans-serif",
    },
  },
  {
    id: "ocean",
    label: "Oceano",
    preview: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)",
    vars: {
      "--form-bg": "#0c4a6e",
      "--form-fg": "#e0f2fe",
      "--form-muted": "#7dd3fc",
      "--form-border": "#075985",
      "--form-input-bg": "#0369a1",
      "--form-input-border": "#0284c7",
      "--form-card-bg": "#075985",
      "--form-accent": "#38bdf8",
      "--form-accent-fg": "#0c4a6e",
      "--form-radius": "0.75rem",
      "--form-font": "'Inter', system-ui, sans-serif",
    },
  },
];

export function getFormTheme(themeId?: string): FormTheme {
  return FORM_THEMES.find(t => t.id === themeId) || FORM_THEMES[0];
}
