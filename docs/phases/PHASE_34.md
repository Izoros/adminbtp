# Phase 34 - Connecteur Odoo social et RH

## Objectif

Etendre le socle Odoo a la gestion sociale sans dupliquer les donnees sensibles
et preparer une connexion JSON-2 securisee, desactivee par defaut.

## Livrables

- mappings collaborateurs, contrats, presences, absences, temps et bulletins ;
- migration additive de l'enum `odoo_binding_type` ;
- adaptateur serveur Odoo 19 JSON-2 a modeles et methodes bornes ;
- validation HTTPS, liste blanche et refus des destinations locales/privees ;
- etat Odoo dans `/odoo` et `/admin/readiness`, sans valeur secrete ;
- formulaires bloques lorsqu'aucun scope Supabase autorise n'est resolu ;
- retour utilisateur apres creation ou mise a jour d'un mapping ;
- test SQL des valeurs sociales et de la politique multi-tenant ;
- runbook d'activation controlee.

## Validation locale du 2026-08-12

- migration appliquee sans reset sur PostgreSQL Supabase local ;
- lint du schema sans erreur ;
- contrat Odoo social execute dans une transaction avec rollback ;
- tests de l'adaptateur, des actions, du tableau Odoo et de la readiness passes ;
- page `/odoo` verifiee visuellement avec les dix formulaires bloques sans scope.
- `npm run audit:prod` : `0` vulnerabilite detectee ;
- build Next.js : `32` routes generees.
- page `/odoo` et etat desactive du connecteur verifies sur la production Vercel.

## Limites explicites

- aucune connexion reelle a une instance Odoo n'est revendiquee ;
- les modeles et champs doivent etre confirmes sur `/doc` dans l'instance cible ;
- la synchronisation automatique et la reprise sur erreur ne sont pas activees ;
- les montants, bulletins et elements salariaux ne sont pas copies dans AdminBTP ;
- la paie depend des modules, licences et localisations de l'instance cible.
