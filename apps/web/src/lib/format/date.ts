import { DEFAULT_ORGANIZATION_TIMEZONE } from "@adminbtp/types";

/**
 * Formate une date dans le fuseau horaire d'une organisation (Phase 11 — paramétrage par
 * organisation au lieu d'une constante Mayotte figée, voir
 * `database/migrations/0037_organization_locale_settings.sql` et
 * `packages/types/src/organization.ts`).
 *
 * Volontairement pas encore branché sur les affichages existants (`toLocaleDateString("fr-FR")`
 * dans les pages de listes/PDF) : ceux-ci utilisent aujourd'hui le fuseau ambiant du runtime, pas
 * une constante codée en dur. Les y faire basculer sur `organization.timezone` changerait le jour
 * affiché pour des événements proches de minuit UTC pour *toutes* les organisations existantes dès
 * le déploiement — une rupture de rétrocompatibilité pour un réglage que personne n'aurait encore
 * choisi. Cette fonction est prête à l'emploi ; son adoption écran par écran reste une décision
 * produit à valider (voir compte-rendu de la tâche).
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const tz = timezone && timezone.trim().length > 0 ? timezone : DEFAULT_ORGANIZATION_TIMEZONE;
  try {
    return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: tz }).format(d);
  } catch {
    // Identifiant de fuseau invalide (saisie libre) : on retombe sur le défaut plutôt que de
    // faire échouer l'affichage.
    return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: DEFAULT_ORGANIZATION_TIMEZONE }).format(d);
  }
}
