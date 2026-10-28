-- AdminBTP — Paramétrage par organisation : fuseau horaire et format de code postal (Phase 11,
-- "Extension hors Mayotte", voir docs/ROADMAP.md).
--
-- Jusqu'ici, Indian/Mayotte et les codes postaux 976xx n'étaient que des hypothèses implicites
-- (guide métier .claude/skills/adminbtp-btp-expert/SKILL.md, exemples/placeholders d'UI) — aucune
-- validation ni constante de fuseau horaire n'était réellement codée en dur dans l'application
-- (apps/web formate les dates avec Intl/toLocaleDateString sans timeZone explicite, et le code
-- postal est un simple champ texte libre, sans regex appliquée). On généralise malgré tout ces
-- hypothèses en réglage explicite par organisation, pour permettre une extension hors Mayotte
-- sans jamais changer le comportement observé par une organisation existante qui ne touche pas à
-- ce réglage :
--   - timezone : défaut 'Indian/Mayotte', valeur textuelle libre (identifiant IANA), affichable et
--     modifiable depuis /parametres. Les appels de formatage qui ne la lisent pas encore continuent
--     de se comporter exactement comme avant (fuseau du runtime, non figé ici).
--   - postal_code_patterns : NULL par défaut = aucun format imposé, soit exactement le
--     comportement actuel (texte libre, aucune validation) pour toute organisation existante et
--     toute nouvelle organisation tant que personne ne renseigne ce réglage. Une organisation peut
--     y déclarer une ou plusieurs regex autorisées (ex: '^976\d{2}$' pour Mayotte) au lieu d'un
--     seul motif figé dans le code.
alter table organizations
  add column timezone text not null default 'Indian/Mayotte',
  add column postal_code_patterns text[];

comment on column organizations.timezone is
  'Identifiant de fuseau horaire IANA (ex: Indian/Mayotte, Europe/Paris) utilisé pour l''affichage des dates/échéances propres à cette organisation. Défaut Indian/Mayotte : préserve le comportement historique tant que l''organisation ne change pas ce réglage.';
comment on column organizations.postal_code_patterns is
  'Liste de motifs (regex) de codes postaux autorisés pour cette organisation (ex: chantiers, profil). NULL ou tableau vide = aucun format imposé (comportement historique : champ texte libre, aucune validation).';
