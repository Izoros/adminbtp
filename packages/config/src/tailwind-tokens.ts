/**
 * Design tokens AdminBTP — source unique de vérité pour la charte visuelle.
 * Direction artistique : bleu nuit / graphite, surfaces claires, accent orange chantier
 * utilisé avec parcimonie (CTA, alertes, éléments de focus métier BTP).
 * Ces valeurs sont dupliquées en CSS custom properties dans apps/web/src/app/globals.css
 * (Tailwind v4 lit les tokens depuis le CSS directement) — garder les deux fichiers synchronisés.
 */
export const colors = {
  night: {
    950: "#0b1220",
    900: "#0f1a2e",
    800: "#16243d",
    700: "#1f344f",
  },
  graphite: {
    900: "#1c1f26",
    700: "#3a3f4b",
    500: "#6b7280",
    300: "#aeb4bf",
  },
  surface: {
    white: "#ffffff",
    subtle: "#f6f7f9",
    muted: "#eef1f5",
    border: "#e2e6ec",
  },
  chantier: {
    orange: "#f2722e",
    orangeSoft: "#fde9dc",
  },
  status: {
    success: "#1f9d55",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#2563eb",
  },
} as const;

export const typography = {
  fontSans: "'Inter', ui-sans-serif, system-ui, sans-serif",
  scale: {
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.9375rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
  },
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
} as const;
