export const dashboardHighlights = [
  {
    title: "Monorepo pret",
    description: "Le depot est organise pour accueillir plusieurs modules sans collision.",
    tone: "warm",
  },
  {
    title: "Supabase branche",
    description: "Le client est encapsule et les variables sont documentees pour la suite.",
    tone: "sage",
  },
  {
    title: "Tests minimum",
    description: "Lint, typage, build et rendu UI sont verifies avant de changer de phase.",
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
