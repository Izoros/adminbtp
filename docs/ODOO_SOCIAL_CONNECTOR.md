# Connecteur Odoo et gestion sociale

## Objectif

AdminBTP fournit un adaptateur serveur natif pour preparer une integration Odoo
19 via l'API JSON-2. Le connecteur est volontairement desactive tant que
l'instance, la base, la cle API et la liste blanche ne sont pas configurees.

Documentation officielle de reference :

- [API externe Odoo 19](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)
- [Applications Ressources humaines](https://www.odoo.com/documentation/19.0/applications/hr.html)
- [Paie Odoo](https://www.odoo.com/documentation/19.0/applications/hr/payroll.html)

## Architecture retenue

- tous les appels Odoo restent cote serveur ;
- les secrets ne sont jamais transmis aux composants React ;
- la destination doit utiliser HTTPS ;
- l'hote doit etre present dans une liste blanche explicite ;
- localhost, les IP privees et les destinations IPv6 litterales sont refuses ;
- le connecteur cible uniquement une liste fermee de modeles et de methodes ;
- les mappings restent isoles par organisation dans Supabase ;
- Odoo reste le systeme de reference pour les donnees sociales et salariales.

## Variables serveur

```dotenv
ADMINBTP_ODOO_ENABLED=false
ADMINBTP_ODOO_BASE_URL=https://odoo.example.com
ADMINBTP_ODOO_DATABASE=database_name
ADMINBTP_ODOO_API_KEY=
ADMINBTP_ODOO_ALLOWED_HOSTS=odoo.example.com
```

Ne jamais ajouter ces valeurs reelles au depot. L'hote de l'URL doit correspondre
exactement a une entree de `ADMINBTP_ODOO_ALLOWED_HOSTS`.

## Contrat JSON-2

Le client appelle :

```text
POST /json/2/<model>/<method>
Authorization: Bearer <API key>
X-Odoo-Database: <database>
Content-Type: application/json
```

Les methodes autorisees par l'adaptateur sont `search_read`, `create` et `write`.
Les modeles autorises sont ceux des mappings commerciaux et sociaux documentes
dans [REVUE_FONCTIONNELLE.md](./REVUE_FONCTIONNELLE.md).

## Activation controlee

1. appliquer la migration `20260812190000_odoo_social_bindings.sql` ;
2. ouvrir la page `/doc` de l'instance Odoo cible ;
3. confirmer chaque modele, champ et droit avec l'utilisateur technique choisi ;
4. creer une cle API limitee et enregistrer les variables sur la preproduction ;
5. laisser `ADMINBTP_ODOO_ENABLED=false` pendant la configuration ;
6. verifier `/admin/readiness` avec un compte plateforme ;
7. activer l'interrupteur uniquement en preproduction ;
8. executer d'abord le probe en lecture seule sur `res.partner/search_read` ;
9. tester un seul mapping factice et controler les journaux Odoo ;
10. definir l'idempotence, la reprise sur erreur et le responsable du rapprochement avant les ecritures automatiques.

## Donnees sociales

Le socle mappe collaborateurs, contrats, presences, absences, temps et bulletins.
Il ne copie pas les montants de paie, le contenu des bulletins ou les elements
salariaux. Toute extension devra preciser la finalite, la duree de conservation,
les droits d'acces et le journal d'audit avant implementation.

## Limites actuelles

- aucun credential Odoo reel n'est configure dans le depot ;
- aucune instance Odoo cible n'a ete testee par cette livraison ;
- les schemas Odoo dependent des modules installes et doivent etre lus dans `/doc` ;
- la disponibilite de la paie et des localisations depend du contrat Odoo cible ;
- le probe de lecture existe dans l'adaptateur, mais aucune synchronisation
  automatique n'est activee ;
- les webhooks, files de reprise et rapprochements restent un lot ulterieur.
