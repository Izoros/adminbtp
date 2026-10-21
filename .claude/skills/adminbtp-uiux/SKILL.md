---
name: adminbtp-uiux
description: Design system AdminBTP — tokens de couleur, composants shadcn-style, conventions de densité d'information et de responsive à respecter pour tout nouvel écran. Utiliser avant de créer ou modifier un composant/écran sous apps/web/src.
---

# Design system AdminBTP

## Principes

- **Densité professionnelle, pas grand public.** Les utilisateurs sont des gestionnaires
  administratifs et chargés d'affaires qui scannent beaucoup de lignes par jour (mails,
  documents, tâches). Préférer des tableaux compacts à des cartes larges quand la donnée est
  tabulaire par nature (documents, relances, organisations).
- **Le statut est toujours visible et coloré.** Chaque entité métier a un statut (`SiteStatus`,
  `DocumentStatus`, `MailStatus`, `TaskStatus`, `PaymentStatus`, `PhaseInstanceStatus`) rendu via
  `Badge` avec une tonalité sémantique cohérente — jamais de texte brut sans badge pour un statut.
- **Les alertes critiques remontent toujours en premier** (cf. `dashboard/page.tsx`) — tri par
  urgence avant tri chronologique sur les écrans de liste (mails, tâches, relances).

## Tokens (packages/config/src/tailwind-tokens.ts, dupliqués en CSS variables dans globals.css)

- `night-*` : fond sombre de la sidebar/topbar sombre.
- `graphite-*` : texte et bordures neutres (graphite-900 = texte principal, graphite-500 =
  texte secondaire).
- `surface-*` : fonds de page/carte (`surface-white`, `surface-subtle`, `surface-border`,
  `surface-muted`).
- `chantier-orange` (+ `-soft`) : couleur d'accent de la marque, réservée aux CTA primaires et
  aux badges "accent" (jamais pour du texte de statut neutre).
- `status-{success,warning,danger,info}` : exclusivement pour les badges/alertes de statut, ne
  jamais réutiliser comme couleur décorative.

Toute nouvelle couleur doit être ajoutée aux deux endroits (tokens + globals.css) dans la même
PR — ne jamais coder une couleur en dur (`#rrggbb` ou `rgb()`) dans un composant.

## Composants de base (apps/web/src/components/ui)

Tous construits à la main avec `cva` (pattern shadcn/ui, pas la CLI shadcn) : `Button`, `Badge`,
`Card`/`CardHeader`/`CardTitle`/`CardContent`, `Input`, `Skeleton`, `EmptyState`, `PageHeader`,
`Tabs`. **Réutiliser ces primitives avant d'en écrire une nouvelle** — un nouvel écran ne doit
quasiment jamais avoir besoin d'un composant UI inédit en Phase 1/2.

Convention d'écran de liste : `PageHeader` (titre + description + action optionnelle) suivi d'un
`Card` contenant soit un tableau (`<table>` stylé en Tailwind, pas de librairie de data-grid),
soit un `EmptyState` si la liste est vide.

## Responsive

- Sidebar fixe visible uniquement `md:flex` (desktop), remplacée par `MobileNav` (drawer plein
  écran) en dessous de `md`. Toujours tester un nouvel écran aux deux largeurs.
- Pas de `min-width` qui dépasse 375px sur un conteneur de page.
- Les tableaux larges doivent rester dans leur `Card` sans provoquer de scroll horizontal de la
  page entière — envisager de réduire les colonnes affichées en mobile plutôt que d'ajouter un
  `overflow-x` non maîtrisé.

## Ce qui est explicitement hors scope Phase 1

- Pas de dark mode à concevoir spécifiquement (la sidebar est volontairement sombre en permanence,
  ce n'est pas un thème).
- Pas d'animations complexes — seule l'animation `skeleton` (chargement) est définie.
- Les formulaires d'édition réelle (organisation, modèles de documents) restent en lecture seule
  tant que la persistance n'est pas branchée (Phase 2) — ne pas simuler une sauvegarde qui ne
  persiste nulle part sans l'indiquer clairement à l'utilisateur (cf. `parametres/page.tsx`).
