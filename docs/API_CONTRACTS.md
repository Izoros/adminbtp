# Contrats de données — AdminBTP

Il n'existe aucune API HTTP en Phase 1 (pas de backend custom, données en mémoire via mock-data).
Ce document liste les **contrats de données** (schémas Zod `@adminbtp/types`) qui serviront de
base aux futurs endpoints (Phase 2+, Supabase ou route handlers Next.js), et les interfaces
d'adaptateur pour les intégrations externes.

## Entités métier (packages/types)

| Entité | Fichier | Clé étrangère tenant |
|---|---|---|
| `Organization` | `organization.ts` | — (racine du tenant) |
| `OrganizationDomain` | `organization.ts` | `organizationId` (plusieurs domaines par organisation) |
| `PlanFeature` | `organization.ts` | référentiel partagé par `subscriptionPlan`, pas de tenant |
| `OrganizationIntegration` | `organization.ts` | `organizationId` (Odoo/n8n isolés, `managedBy: ADMINBTP \| CLIENT`) |
| `SignatureProfile` | `organization.ts` | `organizationId` |
| `PortfolioGrant` | `organization.ts` | `organizationId` (accès cross-tenant explicite, révocable — `revokedAt`/`revokedBy`) |
| `User` | `user.ts` | `organizationId` (nullable pour comptes AdminBTP) ; `roleScope: PLATEFORME \| ENTREPRISE` distinct du rôle chantier |
| `SiteAccess` | `user.ts` | via `siteId` → `Site.organizationId` |
| `Site` | `chantier.ts` | `organizationId` |
| `SiteParticipant` | `chantier.ts` | via `siteId` |
| `Lot` | `chantier.ts` | via `siteId` |
| `PhaseTemplate` / `PhaseTemplateSet` | `phase.ts` | référentiel partagé, pas de tenant |
| `PhaseInstance` | `phase.ts` | via `siteId` |
| `DocumentTemplate` | `document.ts` | `organizationId` |
| `Document` | `document.ts` | `organizationId` |
| `ValidationRecord` | `validation.ts` | via `documentId` |
| `AuditLogEntry` | `validation.ts` | `organizationId` |
| `MailAddress` / `MailThread` | `mail.ts` | `organizationId` |
| `Task` | `task.ts` | `organizationId` |
| `Situation` / `ReminderRule` | `finance.ts` | via `siteId` |
| `ExpertiseRequest` | `expertise.ts` | `organizationId` |

Chaque schéma Zod exporte aussi son type TypeScript inféré (`z.infer<...>`) et, quand pertinent,
un dictionnaire de libellés français (`*_LABELS`) — voir le code source pour le détail champ par
champ, il ne doit jamais être dupliqué ici ni ailleurs.

**Isolation tenant** : `organizationId` reste la clé d'isolation RLS pour toute entité propre à
une organisation. Pour les ressources de chantier partagées entre plusieurs organisations
(`Site` et tout ce qui en dépend : `PhaseInstance`, `Document`, `MailThread`, `Task`, `Situation`,
`ReminderRule`, `SiteParticipant`, `Lot`, `SiteAccess`), l'accès en lecture passe par
`can_access_site()` côté RLS : l'organisation propriétaire du chantier **et** toute organisation
listée comme participante (`SiteParticipant`) y ont accès — jamais les autres chantiers de ces
organisations. Voir `docs/CDC/MULTI_TENANT_SAAS.md`.

## Interfaces d'intégration (packages/integrations)

| Interface | Fichier | Rôle |
|---|---|---|
| `IOdooAdapter` | `odoo/adapter.ts` | Synchronisation Odoo (JSON-2 API préférée pour Odoo 19+), non bloquante |
| `IEmailProvider` | `email/provider.ts` | Envoi/réception email générique par organisation |
| `IWhatsAppProvider` | `whatsapp/provider.ts` | Notifications et preuve d'échange WhatsApp (jamais signature) |
| `IAIProvider` | `ai/provider.ts` | Génération assistée de documents |
| `IN8nClient` | `n8n/client.ts` | Déclenchement de workflows d'automatisation |

Chaque interface a une implémentation `Demo*` (aucun I/O réseau, logs préfixés `[DEMO]`). Toute
implémentation réelle future doit respecter exactement la même interface, pour que le code
`apps/web` n'ait jamais à changer lors du branchement d'un service réel.

## Future API HTTP (Phase 2+, non implémentée)

Quand une persistance réelle sera branchée, les endpoints suivront le découpage par entité
ci-dessus, scoping systématique par `organization_id` (via RLS Supabase plutôt que par filtrage
applicatif manuel — voir `database/policies/0001_rls_policies.sql` et le skill
`adminbtp-multitenant-security`). Ce document sera complété avec les routes exactes
(`route.ts` sous `apps/web/src/app/api/`) à ce moment-là.
