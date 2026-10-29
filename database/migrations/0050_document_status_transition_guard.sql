-- AdminBTP — Garde-fou en base sur les transitions de statut des documents
-- Suite à un audit de sécurité interne (2026-10-29) : la policy RLS d'UPDATE sur `documents`
-- (`documents_update`, migration 0007) ne vérifie que l'appartenance à l'organisation
-- (`can_access_organization(organization_id)`), jamais la cohérence de la transition de statut.
-- Le trigger `documents_enforce_ppsps_preedition` (migration 0035) force bien un PPSPS à naître en
-- PREEDITION, mais seulement à l'INSERT — rien n'empêchait ensuite un appel direct
-- (`supabase.from('documents').update({status: 'VALIDE'})...`, RPC ou API REST) de faire sauter
-- n'importe quel document, PPSPS en tête, de PREEDITION (ou BROUILLON) directement à VALIDE/
-- ENVOYE/ARCHIVE, en contournant tout le circuit préparation→contrôle→dirigeant→signature→
-- envoi→archivage (voir docs/VALIDATION_CHECKLIST.md et le skill adminbtp-project-workflows).
--
-- Même famille de solution que 0031 (meeting_notes_validation_lock) : verrouiller une transition
-- métier au niveau base, pas seulement par convention applicative. Ici on va un cran plus loin
-- qu'un simple filtrage par statut source dans la policy RLS (0031 ne fait que ça, via `using
-- (status = 'BROUILLON')`) : on valide explicitement le couple (ancien statut, nouveau statut),
-- via un trigger BEFORE UPDATE OF status, pour fermer aussi les sauts directs entre deux statuts
-- qui existent tous les deux (ex: PREEDITION -> VALIDE), pas seulement les modifications d'un
-- document déjà figé.
--
-- Étude du cycle de vie réel avant d'écrire cette règle (packages/types/src/document.ts,
-- apps/web/src/lib/actions/documents.ts, document-reviews.ts, acts.ts, mail-filing.ts,
-- validations.ts) : la seule UPDATE de `documents.status` effectuée aujourd'hui par le code
-- applicatif est `runAiReview()` (apps/web/src/lib/actions/document-reviews.ts), qui fait passer
-- un document BROUILLON ou PREEDITION à EN_CONTROLE. Toutes les autres créations
-- (createDocument, generateDocumentFromTemplate, generateDocumentFromPremiumTemplate, emitAct,
-- classifyMailThread) fixent le statut uniquement à l'INSERT (BROUILLON, ou PREEDITION forcé pour
-- PPSPS par le trigger de 0035) et ne font jamais évoluer un document existant vers EN_VALIDATION,
-- VALIDE, ENVOYE ou ARCHIVE : ces transitions existent dans `DocumentStatus`
-- (packages/types/src/document.ts) et sont documentées comme cycle cible par le skill
-- adminbtp-documents, mais aucune Server Action ne les exerce encore via un UPDATE direct sous
-- session utilisateur (le circuit de validation actuel, `validations.ts`, ne touche que
-- `validation_records.decision`, jamais `documents.status`).
--
-- Hypothèse retenue, à valider par un humain avant application (cf. règle de la tâche : ne pas
-- deviner en silence une machine à états sous-documentée) : plutôt que de me limiter à whitelister
-- la seule transition aujourd'hui exercée (BROUILLON/PREEDITION -> EN_CONTROLE), j'autorise aussi,
-- sans casser aucun flux existant puisqu'aucun code ne les emprunte encore, l'intégralité du cycle
-- cible documenté par le skill adminbtp-documents
-- (BROUILLON -> PREEDITION -> EN_CONTROLE -> EN_VALIDATION -> VALIDE -> ENVOYE -> ARCHIVE), avec
-- la règle explicite du skill qu'un document peut sauter EN_CONTROLE ("un courrier simple peut
-- sauter EN_CONTROLE") : BROUILLON et PREEDITION peuvent donc aller directement en EN_VALIDATION.
-- En revanche, je bloque volontairement :
--   1. Tout saut direct vers VALIDE, ENVOYE ou ARCHIVE sans passer par EN_VALIDATION au préalable
--      (c'est précisément le contournement signalé par l'audit) — y compris pour un document qui
--      n'a pas `requiresExpertReview` : le skill n'autorise explicitement que le saut de
--      EN_CONTROLE, jamais celui de EN_VALIDATION, donc je retiens l'interprétation la plus
--      prudente plutôt que de supposer qu'un "courrier simple" peut aussi sauter EN_VALIDATION.
--   2. Toute transition arrière (ex: VALIDE -> EN_VALIDATION pour une "modification demandée",
--      ou EN_CONTROLE -> BROUILLON) : aucun code applicatif ne le fait aujourd'hui et
--      `ValidationRecord.decision` (MODIFICATION_DEMANDEE) ne rétrograde jamais
--      `documents.status` dans le code actuel. Si ce comportement doit exister un jour (renvoyer
--      un document en brouillon après un refus), il faudra l'ajouter explicitement à
--      `is_valid_document_status_transition()` ci-dessous en même temps que le code qui
--      l'exerce — ne pas l'ouvrir par anticipation.
-- Un no-op (status inchangé) reste toujours autorisé : une UPDATE qui touche `status` dans sa
-- clause SET sans changer sa valeur (ex: un ORM qui réécrit la ligne entière) ne doit jamais être
-- bloquée par ce garde-fou.
--
-- Portée : la table `documents` en général (toutes catégories), pas seulement PPSPS — le modèle le
-- permet sans rien casser (voir étude ci-dessus), et une catégorie non-PPSPS mérite la même
-- protection contre un saut de contrôle illégitime.

create or replace function is_valid_document_status_transition(
  old_status document_status,
  new_status document_status
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select old_status = new_status
    or (old_status, new_status) in (
      ('BROUILLON', 'PREEDITION'),
      ('BROUILLON', 'EN_CONTROLE'),
      ('BROUILLON', 'EN_VALIDATION'),
      ('PREEDITION', 'EN_CONTROLE'),
      ('PREEDITION', 'EN_VALIDATION'),
      ('EN_CONTROLE', 'EN_VALIDATION'),
      ('EN_VALIDATION', 'VALIDE'),
      ('VALIDE', 'ENVOYE'),
      ('ENVOYE', 'ARCHIVE')
    );
$$;

create or replace function enforce_document_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_valid_document_status_transition(old.status, new.status) then
    raise exception 'Transition de statut de document invalide : % -> % (document %)',
      old.status, new.status, old.id
      using errcode = '22023'; -- invalid_parameter_value
  end if;
  return new;
end;
$$;

create trigger documents_enforce_status_transition
before update of status on documents
for each row execute function enforce_document_status_transition();

-- Même règle que 0033/0036 pour toute nouvelle fonction SECURITY DEFINER : ni l'une ni l'autre
-- n'a besoin d'être appelable en RPC direct. `is_valid_document_status_transition()` n'est qu'un
-- utilitaire interne au trigger (aucune Server Action ne l'appelle), et un trigger n'a jamais
-- besoin du droit EXECUTE pour s'exécuter (voir la note de 0036 sur enforce_ppsps_preedition()).
revoke execute on function is_valid_document_status_transition(document_status, document_status) from public, anon, authenticated;
revoke execute on function enforce_document_status_transition() from public, anon, authenticated;
