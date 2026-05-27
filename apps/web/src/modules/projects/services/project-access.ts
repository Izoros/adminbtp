import type { OrganizationMembership } from "@/modules/organizations/types/organization";
import type { Project, ProjectOrganization, ProjectRoleView } from "@/modules/projects/types/project";

export const projectRoleViews: Record<string, ProjectRoleView> = {
  moa: {
    role: "moa",
    title: "Vue MOA",
    summary: "Pilotage budget, arbitrages et validations client.",
    priorities: ["Suivi budgetaire", "Arbitrages delais", "Validation livrables"],
    indicators: ["Avancement global", "Ecarts budgetaires", "Points de decision"],
  },
  moe: {
    role: "moe",
    title: "Vue MOE",
    summary: "Coordination technique, visas et animation du chantier.",
    priorities: ["Synthese et visas", "Coordination des lots", "Suivi reserves"],
    indicators: ["Documents a viser", "Reunions planifiees", "Reserves ouvertes"],
  },
  tce: {
    role: "tce",
    title: "Vue entreprise TCE",
    summary: "Conduite d'execution, interfaces lots et preparation production.",
    priorities: ["Planning travaux", "Interfaces de lots", "Conformite documents"],
    indicators: ["Retards potentiels", "Documents manquants", "Lots en attente"],
  },
  bet: {
    role: "bet",
    title: "Vue BET",
    summary: "Production technique et emission des documents d'etudes.",
    priorities: ["Livrables techniques", "Points de calcul", "Interfaces techniques"],
    indicators: ["Plans a emettre", "Demandes MOE", "Questions chantier"],
  },
  opc: {
    role: "opc",
    title: "Vue OPC",
    summary: "Ordonnancement, pilotage et coordination des interventions chantier.",
    priorities: ["Ordonnancement", "Coordination entreprises", "Tenue planning"],
    indicators: ["Taches critiques", "Retards cumules", "Zones sous tension"],
  },
  amo: {
    role: "amo",
    title: "Vue AMO",
    summary: "Reporting maitrise d'ouvrage et controle documentaire contractuel.",
    priorities: ["Reporting MOA", "Controle livrables", "Suivi arbitrages"],
    indicators: ["Revues en attente", "Documents contractuels", "Alerte gouvernance"],
  },
  trade_contractor: {
    role: "trade_contractor",
    title: "Vue entreprise de lot",
    summary: "Execution du lot, preparation des situations et suivi terrain.",
    priorities: ["Production terrain", "Documents d'execution", "Situations de travaux"],
    indicators: ["Blocages lot", "Pieces en attente", "Productivite"],
  },
  subcontractor: {
    role: "subcontractor",
    title: "Vue sous-traitant",
    summary: "Coordination d'intervention et conformite des documents transmis.",
    priorities: ["Acces chantier", "Pieces sous-traitance", "Validation intervention"],
    indicators: ["Interventions a venir", "Documents manquants", "Actions a confirmer"],
  },
};

export function getProjectOrganizationsForUser(
  userId: string,
  memberships: OrganizationMembership[],
  projectOrganizations: ProjectOrganization[],
) {
  const organizationIds = new Set(
    memberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.organizationId),
  );

  return projectOrganizations.filter((projectOrganization) =>
    organizationIds.has(projectOrganization.organizationId),
  );
}

export function getProjectsForUser(
  userId: string,
  memberships: OrganizationMembership[],
  projects: Project[],
  projectOrganizations: ProjectOrganization[],
) {
  const allowedProjectIds = new Set(
    getProjectOrganizationsForUser(userId, memberships, projectOrganizations).map(
      (projectOrganization) => projectOrganization.projectId,
    ),
  );

  return projects.filter((project) => allowedProjectIds.has(project.id));
}

export function getPrimaryProjectRoleView(
  userId: string,
  projectId: string,
  memberships: OrganizationMembership[],
  projectOrganizations: ProjectOrganization[],
) {
  const accessibleProjectOrganizations = getProjectOrganizationsForUser(
    userId,
    memberships,
    projectOrganizations,
  );

  const matchingProjectOrganization = accessibleProjectOrganizations.find(
    (projectOrganization) => projectOrganization.projectId === projectId,
  );

  if (!matchingProjectOrganization) {
    return null;
  }

  return projectRoleViews[matchingProjectOrganization.role] satisfies ProjectRoleView;
}
