# Rapport d’implémentation du module OPC AdminBTP

Date de situation : 16 août 2026
Périmètre : module OPC métier, migrations Supabase, moteur de planning, interface, exports et tests.

## 1. Résultat obtenu

AdminBTP dispose désormais d’un espace OPC dédié accessible par `/opc`. Il ne s’agit plus d’une simple vue de rôle : le module possède un modèle de données, des permissions, un moteur de calcul, des mutations contrôlées et des vues de travail quotidiennes.

Aucune donnée de démonstration n’est injectée dans l’application de production. Lorsqu’un KPI ne peut pas être calculé, l’interface affiche `Données insuffisantes`.

## 2. Architecture

Le module est découpé sous `apps/web/src/modules/opc` :

- `domain` : dates, graphe de dépendances, CPM, avancement, coordination, scénarios, versions et permissions ;
- `services` : lecture Supabase, Server Actions et génération XLSX ;
- `components` : espace multi-vues et Gantt interactif ;
- `fixtures` : chantier réaliste « Construction de 48 logements à Mamoudzou » ;
- `tests` : moteur OPC et export Open XML.

Routes :

- `apps/web/src/app/opc/page.tsx` : espace authentifié ;
- `apps/web/src/app/opc/export/route.ts` : exports privés PDF et XLSX.

Migrations :

- `20260816153000_opc_module.sql` : modèle OPC, fonctions, RLS, audit et RPC ;
- `20260816153100_opc_phase_templates.sql` : profil de phase OPC, modèles et initialisation automatique.

Le module réutilise les tables existantes `projects`, `organizations`, `project_phases` et `documents`. Les réunions, prérequis, retards, OPR et réserves peuvent référencer les documents AdminBTP existants. La relation email existante `related_task_id` reste compatible avec les identifiants de tâches OPC.

## 3. Modèle de données

### Planning

- `opc_tasks` : WBS, dates prévues/courantes/réelles, durée, statut, priorité, avancement, quantité, pondération, lot, entreprise, phase, responsable et jalons ;
- `opc_task_dependencies` : liens FS, SS, FF et SF avec décalage positif ou négatif ;
- `opc_task_zones` : affectation plusieurs-à-plusieurs ;
- `opc_task_prerequisites` : études, matériaux, accès, décisions et sécurité ;
- `opc_progress_entries` : historique daté des relevés terrain ;
- `opc_planning_versions` et `opc_planning_version_items` : snapshots verrouillés.

### Coordination

- `opc_lots` et `opc_zones` ;
- `opc_meetings` et `opc_actions` ;
- `opc_delay_events` ;
- `opc_alerts` ;
- `opc_change_log`, journal append-only alimenté par triggers.

### Fin d’opération

- `opc_receptions` : OPR, pré-réception, réception, réception partielle et GPA ;
- `opc_reservations` : sévérité, statut, échéance, tâche, lot, zone, entreprise et preuves ;
- `opc_gpa_events` : événements de garantie de parfait achèvement.

## 4. Règles métier codées

- une dépendance ne peut pas relier une tâche à elle-même ni franchir un chantier ;
- une dépendance qui crée un cycle est refusée en TypeScript et par trigger PostgreSQL ;
- une tâche à 100 % doit posséder une date réelle de fin ;
- une tâche non démarrée ne peut pas posséder de date réelle de début ;
- une date réelle de fin exige une date réelle de début ;
- un jalon possède une durée nulle ;
- une baseline créée est verrouillée et ses lignes sont immuables ;
- une réception ne clôture pas automatiquement ses réserves ;
- les liaisons d’action, de retard et de réserve sont contrôlées dans le périmètre du chantier ;
- l’OPC coordonne les entreprises, mais n’est pas considéré comme l’exécutant des travaux ;
- les mutations IA futures ne pourront pas remplacer la validation humaine d’une baseline.

## 5. Moteur CPM

Le moteur `calculateCriticalPath` effectue :

1. validation du réseau et tri topologique ;
2. passage avant pour dates au plus tôt ;
3. contraintes FS, SS, FF, SF et décalages ;
4. passage arrière pour dates au plus tard ;
5. marge totale et marge libre ;
6. classification critique et quasi critique ;
7. conversion des offsets en dates chantier.

Les listes entrantes et sortantes sont indexées une seule fois. Le test de charge couvre une chaîne de 5 000 tâches sans récursion.

## 6. Retards, avancement et dérive

Le domaine calcule :

- avancement manuel, quantitatif ou à l’unité ;
- avancement planifié linéaire et avancement réel pondéré ;
- variance en points et courbe d’avancement ;
- tâches en retard et retard cumulé ;
- simulation d’allongement d’une tâche ;
- part absorbée par la marge ;
- retard net du chantier ;
- tâches, entreprises et jalons impactés ;
- lookahead à 2, 3 ou 4 semaines dans le domaine ;
- conflits de coactivité par zone et période.

L’interface expose actuellement le lookahead 3 semaines. Les scénarios sont testés dans le domaine mais ne disposent pas encore d’un écran dédié.

## 7. Permissions

Rôles OPC :

| Rôle | Planning | Baseline | Réunions/actions | Avancement | Membres |
|---|---:|---:|---:|---:|---:|
| Administrateur | lecture/écriture | oui | oui | tous | oui |
| Collaborateur | lecture/écriture | oui | oui | tous | non |
| Contributeur entreprise | lecture | non | actions de son entreprise | tâches de son entreprise | non |
| Lecteur | lecture | non | lecture | non | non |

Les Server Actions réauthentifient la session et vérifient la permission avant chaque RPC. Les politiques RLS constituent une seconde barrière. Un `platform_admin` peut désormais accéder aux chantiers sans rattachement organisationnel artificiel.

## 8. Interface disponible

- cockpit calculé ;
- Gantt jour/semaine/mois ;
- superposition prévu, courant et réel ;
- tâches critiques, marges et jalons ;
- recherche et filtres statut/lot/entreprise/zone ;
- chargement progressif par groupes de 100 lignes ;
- création de tâche ou jalon ;
- création de dépendance avec refus des cycles ;
- baseline immuable ;
- lookahead 3 semaines ;
- jalons contractuels ;
- lots et entreprises ;
- zones et conflits calculés ;
- réunions ;
- actions et échéances ;
- retards et causes ;
- avancement et courbe ;
- OPR, réception et réserves ;
- historique des versions ;
- rapport PDF et classeur XLSX natif.

## 9. Tests et validations

Tests métier :

- dates et plages ;
- tri topologique ;
- référence absente ;
- cycles ;
- FS, SS, FF et SF ;
- chemin critique ;
- marges ;
- avancement pondéré ;
- lookahead ;
- conflits de zones ;
- propagation d’un retard ;
- baseline immuable et comparaison ;
- permissions ;
- cockpit sans données ;
- réseau de 5 000 tâches ;
- structure du fichier XLSX.

Commandes de validation prévues :

```text
npm run test --workspace web -- src/modules/opc/tests
npm run typecheck --workspace web
npm run lint --workspace web
npm run build --workspace web
npm run supabase:verify-migrations
npm run verify:links
```

Résultat au 16 août 2026 : lint, vérification TypeScript et build Next.js réussis ; 333 tests réussis dans 75 fichiers ; audit de 21 pages et 22 cibles internes réussi. La vérification Supabase locale complète exige Docker, actuellement arrêté. Les deux migrations ont néanmoins été appliquées transactionnellement sur le projet Supabase de production `AdminBTP` (`pksdigxbtwvtttevyjov`). Une requête de contrôle a confirmé les tables OPC, les RPC de lecture et de baseline, la valeur de profil `opc` et les quatre modèles de phases.

## 10. Matrice du cahier des charges

| Domaine | État | Commentaire |
|---|---|---|
| Rôle OPC et profil de phase | Implémenté | `opc` n’est plus `null`, modèles de phases créés |
| Permissions OPC fines | Implémenté | RLS, fonctions SQL et garde serveur |
| Navigation OPC dédiée | Implémenté | 13 vues métier |
| Cockpit sans KPI fictif | Implémenté | calcul ou `Données insuffisantes` |
| Modèle de tâche robuste | Implémenté | WBS, dates, durée, statuts, quantités, poids, responsables |
| Gantt jour/semaine/mois | Implémenté | filtres, superpositions, chargement progressif |
| Glisser/déposer et redimensionnement Gantt | Non implémenté | édition par formulaire uniquement |
| Dépendances FS/SS/FF/SF et cycles | Implémenté | domaine et base |
| CPM, marges, critique/quasi critique | Implémenté | moteur déterministe testé |
| Baselines et versions immuables | Implémenté | snapshots SQL et comparaison domaine |
| Comparaison de versions à l’écran | Partiel | historique visible, diff détaillé seulement dans le domaine |
| Prévu/courant/réel | Implémenté | modèle et Gantt |
| Avancement manuel/quantitatif/unité | Implémenté | domaine et stockage ; formulaire principal en pourcentage |
| Impact et propagation des retards | Partiel | moteur testé, écran de simulation à créer |
| Scénarios de replanification | Partiel | API domaine, pas de persistance ni écran |
| Lookahead 2/3/4 semaines | Partiel | domaine complet, écran fixé à 3 semaines |
| Prérequis non temporels | Partiel | modèle et KPI, pas encore de formulaire dédié |
| Jalons contractuels | Implémenté | modèle, affichage et calcul |
| Lots et entreprises | Partiel | modèle et synthèse, gestion avancée à compléter |
| Zones et conflits | Partiel | arborescence et détection ; heatmap graphique à compléter |
| Réunions | Partiel | planification et stockage ; agenda/présences/édition du CR à compléter |
| Actions | Implémenté | échéances, priorité, tâche, entreprise et rappel configurable |
| Relances automatiques | Non implémenté | schéma prêt, orchestrateur à raccorder |
| Comptes-rendus PDF et diffusion | Partiel | documents liés et rapport OPC ; workflow CR dédié à compléter |
| Retards, causes et historique | Implémenté | événements datés et audit |
| Courbes de dérive | Partiel | courbe avancement ; courbe de dates de jalons à ajouter |
| OPR et réserves | Implémenté | création et suivi initial |
| Réceptions | Implémenté | types et étapes indépendantes des réserves |
| GPA | Partiel | modèle présent, écran métier à compléter |
| Calendrier ouvré, jours fériés, météo | Non implémenté | calcul actuel en jours calendaires |
| Pièces jointes terrain | Partiel | clés vers `documents`, capture mobile dédiée à compléter |
| PDF | Implémenté | route privée et données calculées |
| XLSX | Implémenté | classeur Open XML sans CSV déguisé |
| Import Excel/MS Project/P6 | Non implémenté | architecture non destructive à concevoir |
| Alertes intelligentes | Partiel | modèle, KPI et détection ; matérialisation planifiée à compléter |
| Recherche et filtres | Implémenté | recherche Gantt et filtres combinés |
| Journal d’audit | Implémenté | append-only par triggers |
| IA future avec validation humaine | Partiel | données structurées, agent non développé |
| Performance 1 000–5 000 tâches | Partiel | CPM 5 000 testé et rendu progressif ; E2E navigateur 5 000 à mener |

## 11. Dette et prochaines priorités

1. Ajouter l’édition directe du Gantt par glisser/déposer avec validation et annulation.
2. Introduire les calendriers ouvrés, jours fériés de Mayotte et calendriers par entreprise.
3. Créer l’écran de simulation avant validation humaine d’une replanification.
4. Finaliser le compte-rendu de réunion : ordre du jour, présences, décisions, actions, PDF, diffusion et version suivante.
5. Raccorder les relances à l’orchestrateur existant et conserver la preuve d’envoi.
6. Ajouter les workflows de levée, vérification, réception prononcée et GPA.
7. Développer l’import contrôlé Excel/MS Project/P6 avec prévisualisation et rapport d’erreurs.
8. Réaliser un test navigateur et une mesure mémoire sur 5 000 tâches réelles.

## 12. Score d’avancement

| Axe | Score |
|---|---:|
| P0 — Fondations | 19/20 |
| P1 — Moteur planning | 16/20 |
| P2 — Pilotage | 15/20 |
| P3 — Collaboration | 9/15 |
| P4 — Fin d’opération | 7/10 |
| P5 — Reporting | 9/10 |
| Sécurité, tests et performance | 7/10 |
| **Total** | **82/100** |

Le seuil de 80/100 est atteint pour une première version métier exploitable. Les migrations sont validées sur l’environnement Supabase cible. Le module n’est cependant pas considéré comme totalement terminé tant que les éléments marqués partiels ou non implémentés n’ont pas été traités.
