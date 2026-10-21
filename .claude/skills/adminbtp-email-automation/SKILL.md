---
name: adminbtp-email-automation
description: Règles pour l'automatisation email/WhatsApp d'AdminBTP (boîtes génériques par organisation, fournisseurs interchangeables, déclencheurs n8n, ce que WhatsApp peut et ne peut pas prouver). Utiliser pour tout travail touchant MailThread, IEmailProvider, IWhatsAppProvider ou l'écran /mails.
---

# Automatisation email et WhatsApp

## Boîtes génériques, pas de boîtes personnelles

`MailAddress` modélise une **boîte mail générique rattachée à une organisation** (ex:
`madaterrassement@adminbtp.yt`), optionnellement liée à un chantier spécifique via `siteId`. Ce
n'est jamais la boîte personnelle d'un utilisateur — AdminBTP centralise la correspondance
administrative de la société cliente, pas la messagerie individuelle de ses employés.

## Fournisseurs interchangeables

`IEmailProvider` et `IWhatsAppProvider` (`packages/integrations`) sont des interfaces
d'adaptateur : le choix du fournisseur réel (SendGrid, Mailgun, API WhatsApp Business via un BSP,
etc.) ne doit jamais fuiter dans le code applicatif (`apps/web`). Tout code métier dépend de
l'interface, jamais d'une implémentation concrète. Les implémentations `Demo*` ne font aucun I/O
réseau réel et préfixent leurs logs `[DEMO]`.

## Urgence et statut (MailThread)

`MailUrgency` (`NORMALE`/`URGENTE`/`CRITIQUE`) pilote l'ordre d'affichage sur `/mails` et le
tableau de bord — un mail `CRITIQUE` non traité doit systématiquement apparaître dans les
"alertes critiques" du dashboard, jamais seulement dans la liste des mails. `MailStatus` suit le
traitement humain (`NON_TRAITE → AFFECTE → BROUILLON_PRET → EN_VALIDATION → REPONDU → CLOTURE`) —
un brouillon généré automatiquement (IA ou règle n8n) doit toujours s'arrêter à
`BROUILLON_PRET`, jamais `REPONDU` directement : une automatisation ne doit jamais envoyer un
mail en lieu et place d'une décision humaine sans validation explicite.

## WhatsApp — ce qu'il peut et ne peut jamais prouver

WhatsApp sert à **notifier et recueillir un accord rapide** (ex: "confirmez-vous l'envoi de ce
courrier ?"), jamais à produire une preuve juridique de signature. Tout échange WhatsApp utilisé
comme élément de preuve doit être stocké comme `whatsappProofUrl` sur un `ValidationRecord` —
jamais comme substitut de `signatureProvider`/`isLegallyBindingSignature`. Voir
[[adminbtp-project-workflows]] pour le détail du circuit de validation.

## Déclencheurs n8n (IN8nClient)

n8n orchestre les automatisations qui touchent plusieurs systèmes (ex: "un mail CRITIQUE non
traité depuis 2h → créer une tâche + notifier WhatsApp le gestionnaire référent"). Règles :

1. Toute automatisation n8n qui crée ou modifie une donnée métier doit produire un
   `AuditLogEntry` avec `actorType: "AUTOMATION"`.
2. n8n ne doit jamais être un chemin bloquant pour l'utilisateur — si n8n est indisponible,
   l'application doit rester pleinement utilisable manuellement (cf. le principe "Odoo non
   bloquant" dans [[adminbtp-odoo]], qui s'applique de la même façon à n8n).
3. Le client `IN8nClient` est lui aussi interchangeable/démo-compatible — ne jamais appeler un
   webhook n8n réel depuis le mode démo.
