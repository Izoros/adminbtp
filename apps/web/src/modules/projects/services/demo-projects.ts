import type {
  Project,
  ProjectOrganization,
  ProjectRoleView,
} from "@/modules/projects/types/project";

export const demoProjects: Project[] = [
  {
    id: "project_001",
    code: "ABTP-CHANTIER-001",
    slug: "renovation-college-kaweni",
    name: "Renovation college Kaweni",
    description:
      "Chantier pilote multi-acteurs pour valider les roles projet et les vues par profil.",
    status: "active",
    ownerOrganizationId: "org_adminbtp_001",
    startsOn: "2026-05-01",
    endsOn: "2026-12-18",
  },
];

export const demoProjectOrganizations: ProjectOrganization[] = [
  {
    projectId: "project_001",
    organizationId: "org_adminbtp_001",
    role: "opc",
    isLead: true,
  },
  {
    projectId: "project_001",
    organizationId: "org_moe_002",
    role: "moe",
    isLead: true,
  },
  {
    projectId: "project_001",
    organizationId: "org_client_004",
    role: "moa",
    isLead: true,
  },
  {
    projectId: "project_001",
    organizationId: "org_tce_005",
    role: "tce",
    isLead: true,
  },
];

export const projectRoleViews: Record<string, ProjectRoleView> = {
  moa: {
    role: "moa",
    title: "Vue maitrise d'ouvrage",
    summary: "Pilotage global, budget, decisions et validation documentaire.",
    priorities: [
      "Suivre l'avancement global et les arbitrages",
      "Verifier les alertes budgetaires et contractuelles",
      "Centraliser les validations majeures",
    ],
    indicators: ["Avancement global", "Budget engage", "Decisions en attente"],
  },
  moe: {
    role: "moe",
    title: "Vue maitrise d'oeuvre",
    summary: "Coordination, visas, interfaces techniques et suivi d'execution.",
    priorities: [
      "Piloter les visas et reserves",
      "Suivre la coordination inter-lots",
      "Contrôler la conformite d'execution",
    ],
    indicators: ["Visas a traiter", "Reserves ouvertes", "Points interface"],
  },
  tce: {
    role: "tce",
    title: "Vue entreprise TCE",
    summary: "Organisation chantier, sous-traitance et production documentaire.",
    priorities: [
      "Structurer les relances terrain",
      "Suivre la sous-traitance et les pieces manquantes",
      "Preparer les situations de travaux",
    ],
    indicators: ["Documents manquants", "Sous-traitants actifs", "Situations a emettre"],
  },
  bet: {
    role: "bet",
    title: "Vue BET",
    summary: "Analyses techniques, notes de calcul et suivi des demandes d'etudes.",
    priorities: [
      "Centraliser les demandes d'etudes",
      "Suivre les livrables de calcul",
      "Relever les points techniques critiques",
    ],
    indicators: ["Etudes ouvertes", "Livrables attendus", "Alertes techniques"],
  },
  opc: {
    role: "opc",
    title: "Vue OPC",
    summary: "Ordonnancement, coordination, synchronisation et alertes planning.",
    priorities: [
      "Maintenir le planning et les dependances",
      "Suivre les jalons sensibles",
      "Distribuer les actions de coordination",
    ],
    indicators: ["Jalons a risque", "Actions OPC", "Retards critiques"],
  },
  amo: {
    role: "amo",
    title: "Vue AMO",
    summary: "Accompagnement MOA, synthese d'aide a la decision et suivi des engagements.",
    priorities: [
      "Aider a la decision client",
      "Suivre les points contractuels",
      "Formaliser les syntheses executives",
    ],
    indicators: ["Arbitrages ouverts", "Livrables AMO", "Echeances client"],
  },
  trade_contractor: {
    role: "trade_contractor",
    title: "Vue entreprise de lot",
    summary: "Taches de lot, demandes terrain et validation des interfaces.",
    priorities: [
      "Suivre les actions de lot",
      "Gerer les interfaces montantes et descendantes",
      "Preparer les validations de lot",
    ],
    indicators: ["Actions lot", "Interfaces ouvertes", "Documents lot"],
  },
  subcontractor: {
    role: "subcontractor",
    title: "Vue sous-traitant",
    summary: "Execution ciblee, remise des pieces et suivi des consignes chantier.",
    priorities: [
      "Recevoir les consignes utiles",
      "Remettre les documents attendus",
      "Suivre le planning d'intervention",
    ],
    indicators: ["Consignes", "Pieces dues", "Interventions programmees"],
  },
};
