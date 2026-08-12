# Phase 36 - Durcissement post-audit et navigation terrain

## Source

Cette phase repond aux constats reproductibles du rapport externe Claude du
12 aout 2026 fourni localement par le proprietaire du projet. Le rapport
original est conserve comme entree utilisateur et n'est ni modifie ni ajoute au
commit applicatif par cette phase.

## Corrections livrees

- `R-01` : retrait du droit `UPDATE` global sur `user_profiles`, permission
  limitee a `full_name` et `default_organization_id`, plus trigger de defense en
  profondeur sur `internal_role`
- `R-02` : six helpers de politique RLS en `SECURITY DEFINER`, `search_path`
  explicite et droits d'execution minimaux
- `R-03` : validation des redirections par construction d'URL et comparaison
  d'origine, avec tests des antislashs
- `R-05` : erreurs de creation projet et organisation remplacees par une
  enumeration fermee ; les details SQL restent dans les journaux serveur
- `R-06` : nonce CSP genere dans `proxy.ts`, retrait de `unsafe-inline` et
  `unsafe-eval` de `script-src` en production, HSTS, COOP et CORP ajoutes
- proxy replace sous `src/proxy.ts`, au meme niveau que `src/app`, afin que
  Next.js execute reellement la CSP et le garde d'authentification ; le build
  confirme maintenant explicitement `Proxy (Middleware)`
- `R-07` : webhooks n8n fermes par defaut avec une reponse `503` sans secret
- `R-08` : `org_viewer` reste en lecture seule sur les suggestions IA et leurs
  journaux ; `org_member`, `org_admin` et `org_owner` conservent l'ecriture
- `B-04` : PDF avec repli mesure, pages multiples et remplacement controle des
  caracteres non representables par Helvetica
- `B-05/B-06` : `ModulePageFrame` delegue maintenant au cadre applicatif unique,
  menu mobile complet et barre de cinq raccourcis
- `B-07` : lectures du cockpit bornees explicitement a 1 000 lignes avec
  comptage exact ; les KPI sont suspendus si une reponse est tronquee au lieu
  d'afficher un total silencieusement faux
- `B-08/B-13` : suppression du decodage d'erreur libre et journalisation serveur
  des erreurs de scope
- `B-10` : retour explicite et `aria-live` sur les trois actions du module phases
- ajout de `error.tsx`, `loading.tsx`, `not-found.tsx`, manifeste et icone propre
- suppression des metriques fictives mortes, des SVG Next.js inutilises et de
  la seconde source de verite SQL `database/`

## Validation et deploiement

- migration additive : `20260812200000_security_audit_hardening.sql`
- verification PostgreSQL transactionnelle :
  `scripts/sql/verify-security-audit-contracts.sql`
- tentative d'auto-elevation refusee avec le role `authenticated`
- lecture RLS de `organization_members` reussie sans recursion
- mise a jour autorisee de `full_name` conservee
- `npm run verify` reussi : lint, typage, 316 tests et build Next.js
- `npm audit --omit=dev` : aucune vulnerabilite connue
- migration rejouee et contrats SQL valides sur la pile Supabase locale
- commit applicatif `e7fe6dd` deploye par l'integration Git sur
  `https://adminbtp.vercel.app`
- recette de production reussie : 20 pages, 21 liens, 19 redirections privees,
  en-tetes de securite, endpoint de sante et webhook WhatsApp ferme par defaut

## Limites et travaux suivants

- la migration doit etre appliquee et verifiee sur une preproduction Supabase ;
  une validation locale ne prouve pas l'etat distant
- la protection anti-abus locale est resserree a 10 connexions/inscriptions par
  cinq minutes et les mots de passe a 10 caracteres avec complexite ; les
  reglages du projet distant et un CAPTCHA restent a controler dans Supabase
- `style-src 'unsafe-inline'` reste temporairement necessaire aux styles React ;
  les scripts, vecteur principal d'execution XSS, sont maintenant proteges par nonce
- le stockage documentaire, les reserves, le planning et le mode hors ligne
  restent des chantiers produit majeurs distincts de cette phase de securite
- un audit d'intrusion externe et des tests RLS sur la preproduction restent
  necessaires avant une qualification commerciale
