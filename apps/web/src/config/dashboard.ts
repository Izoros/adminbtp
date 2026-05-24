export const dashboardHighlights = [
  {
    title: "Pilotage centralise",
    description: "Le dashboard admin agrège charge, relances, validations et flux d expertise.",
    tone: "warm",
  },
  {
    title: "Flux reels branches",
    description: "Supabase, n8n, Odoo et les parcours metier majeurs sont deja exploitables.",
    tone: "sage",
  },
  {
    title: "Exploitation tracee",
    description: "Chaque lot passe par lint, typage, tests, build et verification de production.",
    tone: "ink",
  },
] as const;

export const validationChecklist = [
  "Application demarrable localement via npm run dev",
  "Design system de base disponible avec shadcn/ui",
  "Navigation principale accessible et responsive",
  "Client Supabase initialise via variables publiques",
  "Tests minimum prets pour la suite de la roadmap",
];

export const adminMetrics = [
  {
    label: "Chantiers suivis",
    value: "24",
    delta: "+3 ce mois",
    tone: "warm",
  },
  {
    label: "Docs a valider",
    value: "17",
    delta: "6 urgents",
    tone: "ink",
  },
  {
    label: "Relances actives",
    value: "42",
    delta: "J+15 majoritaire",
    tone: "sage",
  },
  {
    label: "Heures conseil",
    value: "128 h",
    delta: "74 % vendues consommees",
    tone: "warm",
  },
] as const;

export const adminRevenueSeries = [
  { label: "Jan", committed: 28, invoiced: 19 },
  { label: "Fev", committed: 31, invoiced: 24 },
  { label: "Mar", committed: 35, invoiced: 27 },
  { label: "Avr", committed: 41, invoiced: 33 },
  { label: "Mai", committed: 46, invoiced: 38 },
  { label: "Juin", committed: 52, invoiced: 44 },
] as const;

export const adminLoadSeries = [
  { label: "Lun", emails: 14, documents: 9, consulting: 4 },
  { label: "Mar", emails: 18, documents: 12, consulting: 5 },
  { label: "Mer", emails: 16, documents: 14, consulting: 6 },
  { label: "Jeu", emails: 22, documents: 15, consulting: 7 },
  { label: "Ven", emails: 19, documents: 11, consulting: 5 },
] as const;

export const adminAlerts = [
  {
    title: "3 validations client bloquées",
    detail: "Deux documents MOE et un DGD attendent un retour depuis plus de 72 h.",
    tone: "rose",
  },
  {
    title: "Pic de relances J+30",
    detail: "Le lot decomptes concentre 9 actions a reprendre avant vendredi 16h.",
    tone: "amber",
  },
  {
    title: "Capacite expertise tendue",
    detail: "Le pool ingenieur approche 80 % de charge sur les demandes DOE et EXE.",
    tone: "emerald",
  },
] as const;

export const adminKanbanColumns = [
  {
    id: "incoming",
    title: "A qualifier",
    accent: "amber",
    cards: [
      {
        title: "Lot facades - relance DOE",
        meta: "Email entrant",
        owner: "Gestion admin",
        eta: "Aujourd'hui",
      },
      {
        title: "Question PMR residence Kani",
        meta: "Avis reglementaire",
        owner: "Architecte HMONP",
        eta: "Sous 24 h",
      },
    ],
  },
  {
    id: "active",
    title: "En cours",
    accent: "sky",
    cards: [
      {
        title: "Visa EXE - college Kaweni",
        meta: "Validation documentaire",
        owner: "MOE",
        eta: "Demain",
      },
      {
        title: "Mapping facture Odoo",
        meta: "Back-office",
        owner: "Ops AdminBTP",
        eta: "Cette semaine",
      },
      {
        title: "Relances situations TCE",
        meta: "Tresorerie",
        owner: "Gestion admin",
        eta: "Aujourd'hui",
      },
    ],
  },
  {
    id: "review",
    title: "A arbitrer",
    accent: "rose",
    cards: [
      {
        title: "Synthese IA PPSPS",
        meta: "Validation humaine",
        owner: "Ingenieur BTP",
        eta: "Ce soir",
      },
      {
        title: "OS modificatif lot CVC",
        meta: "Circuit signature",
        owner: "Direction travaux",
        eta: "Sous 48 h",
      },
    ],
  },
  {
    id: "done",
    title: "Livrables termines",
    accent: "emerald",
    cards: [
      {
        title: "Consultation DOE - Mamoudzou",
        meta: "Assistance MOE",
        owner: "Ingenieur BTP",
        eta: "Livre",
      },
      {
        title: "Client Odoo - org_adminbtp_001",
        meta: "Synchronisation",
        owner: "Ops AdminBTP",
        eta: "Livre",
      },
    ],
  },
] as const;
