# Revue fonctionnelle AdminBTP

## Objet de la revue

Ce document permet de controler la webapp page par page et de distinguer trois
niveaux qui ne doivent pas etre confondus :

- `Verifie` : la route, son rendu et ses liens internes passent les controles locaux ;
- `Sous conditions` : le parcours metier exige une session, un role, des donnees ou une migration Supabase ;
- `A activer` : le socle existe, mais le service externe n'est pas configure ou n'a pas encore ete teste de bout en bout.

Date de la revue : `2026-08-12`.

## Resultat de l'audit des pages et des liens

- `20` pages statiques detectees automatiquement ;
- `21` cibles internes controlees ;
- `6` redirections attendues vers `/login` ;
- aucune cible interne sans route connue ;
- aucune page vide, erreur HTTP ou reponse non HTML ;
- controle visuel effectue sur l'accueil, le didacticiel et le module Odoo ;
- le controle est rejouable avec `npm run verify:links -- <URL>`.

Les redirections attendues concernent `/admin/alerts`, `/admin/archives`,
`/admin/commands`, `/admin/readiness`, `/projects` et `/auth/logout` lorsque la
session requise est absente.

## Revue page par page

| A verifier | Page | Fonction | Etat constate | Controle manuel conseille |
| --- | --- | --- | --- | --- |
| [ ] | `/` | Accueil, synthese des modules et raccourcis de pilotage | Verifie | Ouvrir chaque carte et confirmer que le vocabulaire correspond a votre activite |
| [ ] | `/login` | Connexion par mot de passe ou lien magique Supabase | Sous conditions | Tester un compte autorise, un mauvais mot de passe et le retour vers la page demandee |
| [ ] | `/guide` | Didacticiel permanent en 8 etapes avec progression locale | Verifie | Cocher les 8 etapes, recharger la page puis reinitialiser la progression |
| [ ] | `/admin` | Cockpit operationnel et acces aux outils plateforme | Verifie, donnees sous conditions | Verifier les compteurs avec un compte plateforme |
| [ ] | `/admin/archives` | Etat des archives, echecs, retards et executions bloquees | Sous conditions | Tester avec un administrateur puis avec un utilisateur standard |
| [ ] | `/admin/commands` | File WhatsApp et revue humaine approve/refuse | Sous conditions ; execution automatique absente | Verifier qu'une approbation ne declenche aucune commande metier |
| [ ] | `/admin/alerts` | Outbox et supervision des alertes d'exploitation | Sous conditions | Tester reservation, livraison et erreur avec un webhook de preproduction |
| [ ] | `/admin/readiness` | Preparation Supabase, WhatsApp, archives, alertes et Odoo | Sous conditions | Confirmer qu'aucun secret ou identifiant complet n'est affiche |
| [ ] | `/organizations` | Organisations, membres, roles et perimetre multi-tenant | Sous conditions | Creer une organisation puis verifier qu'un autre tenant ne la voit pas |
| [ ] | `/projects` | Chantiers et roles projet | Sous conditions | Creer un chantier, l'affecter a une organisation et verifier la redirection sans session |
| [ ] | `/phases` | Parcours chantier, jalons, checklists et alertes | Sous conditions | Choisir plusieurs profils metier et controler leurs phases differentes |
| [ ] | `/documents` | Base documentaire, templates, rendu et statuts | Sous conditions | Generer un document factice et controler les variables et le rendu |
| [ ] | `/signatures` | Circuits de validation et journal de decision | Sous conditions | Soumettre puis approuver/refuser avec les bons roles |
| [ ] | `/emails` | Boites generiques, classification et rattachement metier | Sous conditions | Rattacher un email factice a la bonne organisation et au bon chantier |
| [ ] | `/n8n` | Presentation et suivi des workflows d'automatisation | A activer pour un n8n reel | Envoyer un webhook signe depuis une preproduction n8n |
| [ ] | `/followups` | Situations, echeances et relances de tresorerie | Sous conditions | Generer les jalons J+7, J+15, J+30 et J+45 d'une situation factice |
| [ ] | `/odoo` | Mappings commerciaux, sociaux et etat du connecteur JSON-2 | Socle verifie ; connexion reelle a activer | Confirmer les modeles sur `/doc`, creer les mappings puis faire un test lecture seule |
| [ ] | `/consulting` | Demandes d'expertise, missions, revues et temps de conseil | Sous conditions | Creer une demande et verifier le passage vers une mission tracee |
| [ ] | `/ai` | Suggestions IA avec validation humaine obligatoire | Sous conditions | Refuser puis approuver une suggestion factice et verifier l'audit |
| [ ] | `/client-space` | Portail client, validations et commentaires limites au tenant | Sous conditions | Comparer la vue du client et celle d'un compte interne |

## Routes techniques et automatisations

| A verifier | Route | Contrat attendu | Etat |
| --- | --- | --- | --- |
| [ ] | `/api/health` | Retour de sante sans secret | Verifie par le smoke |
| [ ] | `/auth/callback` | Echange du code Supabase puis redirection bornee | Sous conditions |
| [ ] | `/auth/password-login` | Authentification mot de passe et erreurs utilisateur sures | Sous conditions |
| [ ] | `/auth/logout` | Fin de session puis retour login | Sous conditions |
| [ ] | `/api/n8n/inbound-task` | Creation de tache avec secret partage | A tester avec n8n |
| [ ] | `/api/n8n/validation-request` | Demande de validation avec secret partage | A tester avec n8n |
| [ ] | `/api/webhooks/whatsapp` | Challenge Meta, signature HMAC et liste blanche | Livre desactive ; Meta a tester |
| [ ] | `/api/cron/market-archive` | Archive verifiee, cron protege et cible locale/SFTP | Livre desactive ; LWS/SFTP a tester |
| [ ] | `/api/cron/operations-alerts` | Purge, detection et livraison d'alertes | Livre desactive ; webhook a tester |

## Fonctionnalites metier disponibles

### Administration et acces

- authentification Supabase SSR ;
- isolation par organisation et roles projet ;
- controles serveur des scopes avant les mutations sensibles ;
- cockpit et pages d'exploitation reserves aux administrateurs plateforme ;
- didacticiel contextuel et page d'aide permanente.

### Gestion BTP

- organisations, membres et roles ;
- chantiers multi-acteurs MOA, MOE, TCE, BET, OPC, AMO, entreprises et sous-traitants ;
- phases et checklists adaptees au profil ;
- documents et templates ;
- circuits de signature et validations tracees ;
- emails classes par dossier ;
- situations de travaux, echeances et planning de relance ;
- espace client limite aux donnees autorisees.

### Expertise et assistance

- demandes de conseil ingenieur et architecte HMONP ;
- missions, revues techniques et suivi du temps ;
- suggestions IA non irreversibles, soumises a validation humaine.

### Exploitation

- archives longue duree avec checksum, relecture et journal ;
- detection des archives en echec, en retard ou bloquees ;
- outbox d'alertes idempotente ;
- file de commandes WhatsApp signee, anonymisee et revue humainement ;
- retention automatique des donnees d'exploitation ;
- tableau de preparation des services externes sans restitution des secrets.

### Odoo commercial et social

Les liaisons suivantes sont prises en charge dans le modele AdminBTP :

- clients `res.partner` ;
- factures `account.move` ;
- abonnements `sale.subscription` ;
- prestations `product.product` ;
- collaborateurs `hr.employee` ;
- contrats `hr.contract` ;
- presences `hr.attendance` ;
- conges et absences `hr.leave` ;
- feuilles de temps `account.analytic.line` ;
- bulletins de paie `hr.payslip`.

AdminBTP conserve des correspondances d'identifiants. Les montants, bulletins et
elements salariaux ne sont pas recopies par les nouveaux formulaires. Odoo reste
le systeme de reference du volet social.

## Corrections et ajouts issus de la revue

- ajout de la page `/guide`, accessible en permanence ;
- ajout d'une progression en 8 etapes, stockee uniquement dans le navigateur ;
- ajout de `/emails`, `/phases`, `/guide` et `/odoo` au smoke ;
- ajout d'un audit qui decouvre toutes les pages et les liens internes ;
- correction de l'etat des formulaires Odoo : aucune ecriture sans scope reel ;
- restitution d'un retour utilisateur apres une mutation Odoo ;
- extension Odoo aux six domaines sociaux et RH ;
- ajout d'un adaptateur Odoo 19 JSON-2 desactive par defaut ;
- ajout d'un contrat PostgreSQL verifiant les valeurs sociales et la politique multi-tenant.

## Limites et travaux externes restants

- la presence d'un ecran ou d'une variable ne prouve pas une connexion distante ;
- Supabase distant doit etre migre et teste avec de vrais comptes et RLS ;
- l'instance Odoo cible, sa version, ses applications installees et ses champs
  doivent etre verifies sur sa documentation dynamique `/doc` ;
- la paie depend de l'edition Odoo, des modules et de la localisation applicables ;
- WhatsApp exige un compte Meta Business de test et ses secrets ;
- l'archivage exige un essai reel d'ecriture, relecture et restauration LWS/SFTP ;
- n8n et les alertes exigent des destinations de preproduction controlees ;
- un audit metier, securite et accessibilite humain reste necessaire avant une release engageante.

## Idees metier pour les prochains lots

Ces fonctions sont pertinentes, mais ne sont pas annoncees comme livrees :

- suivi des habilitations, formations et dates d'expiration du personnel ;
- conformite des sous-traitants et pieces administratives obligatoires ;
- affectation des collaborateurs, materiels et temps par chantier ;
- export controle des variables de temps vers la paie Odoo ;
- alertes sur contrats, absences et capacite des equipes ;
- tableau de cout previsionnel/reel par chantier sans dupliquer la comptabilite Odoo ;
- journal de synchronisation, reprise sur erreur et rapprochement AdminBTP/Odoo.

## Checklist de recette utilisateur

- [ ] Je peux me connecter et me deconnecter.
- [ ] Un compte sans droit ne voit ni ne modifie les donnees d'une autre organisation.
- [ ] Je peux suivre le didacticiel et retrouver ma progression apres rechargement.
- [ ] Je peux creer l'organisation, le chantier et son role principal.
- [ ] Les phases correspondent a mon metier reel.
- [ ] Un document et une validation sont rattaches au bon chantier.
- [ ] Les emails et relances sont relies au bon dossier.
- [ ] Une action IA sensible attend bien une validation humaine.
- [ ] Les pages plateforme refusent un utilisateur standard.
- [ ] Aucun secret ni donnee salariale n'apparait dans les tableaux de preparation.
- [ ] Les modeles Odoo sont confirmes dans `/doc` avant tout envoi de donnees.
- [ ] Les essais WhatsApp, n8n, Odoo, alertes et archives utilisent une preproduction.
