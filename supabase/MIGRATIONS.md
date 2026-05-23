# Manifest des migrations Supabase

## Ordre des migrations

1. `20260521190828_auth_multitenant.sql`
2. `20260521190830_projects.sql`
3. `20260521190831_project_phases.sql`
4. `20260521190832_documents.sql`
5. `20260521190833_signatures_and_audit.sql`
6. `20260521190835_emails.sql`
7. `20260521190836_followups.sql`
8. `20260521190837_odoo.sql`
9. `20260521190838_consulting_foundation.sql`
10. `20260521190839_ai_governance.sql`
11. `20260521190841_client_space.sql`
12. `20260521190842_security_hardening.sql`

## Intention de chaque migration

- `auth_multitenant` : utilisateurs, organisations, membres, fonctions RLS de base
- `projects` : chantiers et roles projet
- `project_phases` : phases, checklists et alertes
- `documents` : templates et documents
- `signatures_and_audit` : signatures, validations et journal d'audit
- `emails` : boites et emails
- `followups` : situations et relances
- `odoo` : liaisons Odoo
- `consulting_foundation` : expertise, missions, heures et avis techniques
- `ai_governance` : suggestions IA et audit
- `client_space` : acces client et commentaires
- `security_hardening` : contraintes et RLS complementaires

## Regle de travail

Toute nouvelle evolution base de donnees doit passer par une nouvelle
migration `supabase/migrations` et ne doit pas modifier retroactivement
les migrations deja partagees sans validation explicite.
