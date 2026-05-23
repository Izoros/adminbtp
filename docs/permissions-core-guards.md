# Permissions core guards

Ce document decrit le noyau partage ajoute pour centraliser les scopes serveur et les garde-fous de permissions sans refactor massif des modules metier.

## Emplacement

- `apps/web/src/lib/permissions/server-scope.ts`
- `apps/web/src/lib/permissions/server-guards.ts`
- `apps/web/src/lib/permissions/index.ts`

## Ce que couvre le noyau

- resolution d'un scope organisation serveur depuis `organization_members` et `user_profiles`
- resolution d'un scope projet serveur depuis `project_organizations`
- normalisation et deduplication des identifiants de scope
- garde-fous reutilisables pour verifier l'acces organisation/projet
- helpers de gestion des organisations administrables

## API principale

```ts
import {
  assertOrganizationAccess,
  assertProjectAccess,
  canManageOrganization,
  loadServerOrganizationScope,
  loadServerProjectScope,
} from "@/lib/permissions";

const organizationScope = await loadServerOrganizationScope(supabase);

if (!organizationScope) {
  // bascule eventuelle vers le mode demo ou retour controle
}

const organizationId = assertOrganizationAccess(
  organizationScope,
  formData.get("organizationId")?.toString(),
);

const projectScope = await loadServerProjectScope(
  supabase,
  organizationScope.accessibleOrganizationIds,
);

if (projectScope) {
  assertProjectAccess(projectScope, {
    projectId: formData.get("projectId")?.toString(),
    organizationId,
  });
}

if (!canManageOrganization(organizationScope, organizationId)) {
  // garde-fou metier complementaire
}
```

## Intention d'adoption

- `ai-data` et `client-space-data` peuvent remplacer leur resolution locale du scope organisation par `loadServerOrganizationScope`
- les actions serveur qui recoivent `organizationId` ou `projectId` peuvent appliquer `assertOrganizationAccess` et `assertProjectAccess` avant les lectures/ecritures metier
- les modules conservent leurs regles specifiques; ce noyau ne remplace pas les validations metier fines

## Couverture de tests

- le noyau partage est couvert par [server-scope.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/lib/permissions/server-scope.test.ts:1) et [server-guards.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/lib/permissions/server-guards.test.ts:1)
- les actions App Router [organizations/actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/organizations/actions.test.ts:1) et [projects/actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/app/projects/actions.test.ts:1) couvrent les redirections de securite sur absence de session, perimetre insuffisant et erreurs fonctionnelles
- les refus de scope sur les actions sensibles sont verifies sur [document-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/documents/tests/document-actions.test.ts:1) et [signature-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/signatures/tests/signature-actions.test.ts:1)
- les actions `consulting` et `client-space` exposent aussi leurs refus de scope via [consulting-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/consulting/tests/consulting-actions.test.ts:1) et [client-space-actions.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/client-space/tests/client-space-actions.test.ts:1)
- les readers Supabase `emails` et `followups` verifient aussi le filtrage par `organization_id` et les refus implicites hors scope dans [supabase-email-data.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/emails/tests/supabase-email-data.test.ts:1) et [supabase-followup-data.test.ts](/Users/symba/Documents/9_AdminBTP/apps/web/src/modules/followups/tests/supabase-followup-data.test.ts:1)
- chaque erreur utilisateur remontee par ces garde-fous reste explicite, sans laisser passer d'ecriture partielle ni de revalidation de cache
