import { colors } from "@adminbtp/config/tailwind-tokens";

/**
 * Logique de présentation partagée, indépendante de React, pour que les mêmes règles
 * visuelles (libellé + couleur de statut) puissent être réutilisées par n'importe quel
 * frontend futur (webapp Next.js aujourd'hui, mobile demain). Les composants React
 * concrets (badges shadcn/ui, etc.) vivent dans apps/web/src/components.
 */
export type SemanticTone = "success" | "warning" | "danger" | "info" | "neutral";

export const TONE_COLOR: Record<SemanticTone, string> = {
  success: colors.status.success,
  warning: colors.status.warning,
  danger: colors.status.danger,
  info: colors.status.info,
  neutral: colors.graphite[500],
};

export function toneForSiteStatus(status: string): SemanticTone {
  switch (status) {
    case "EN_COURS":
      return "info";
    case "RECEPTION":
    case "GPA":
      return "warning";
    case "CLOTURE":
      return "success";
    case "SUSPENDU":
      return "danger";
    default:
      return "neutral";
  }
}
