import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OdooMappingBoard } from "@/modules/settings/components/odoo-mapping-board";
import type { OdooMappingBoardData } from "@/modules/settings/types/odoo";

function buildData(canWrite: boolean): OdooMappingBoardData {
  return {
    organizationId: canWrite ? "org_001" : "organization_indisponible",
    customerMapping: undefined,
    invoiceMappings: [],
    subscriptionMappings: [],
    consultingMappings: [],
    socialMappings: {
      employee: [],
      employment_contract: [],
      attendance: [],
      time_off: [],
      timesheet: [],
      payslip: [],
    },
    connectionReadiness: {
      status: "inactive",
      statusLabel: "Desactive",
      checks: [],
    },
    canWrite,
    dataOrigin: "supabase",
    fallbackReason: canWrite ? undefined : "Session requise.",
  };
}

describe("tableau de mapping Odoo", () => {
  it("presente tous les domaines sociaux sans contenu salarial", () => {
    render(
      <OdooMappingBoard
        initialData={buildData(true)}
        upsertMappingAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Collaborateurs")).toBeInTheDocument();
    expect(screen.getByText("Contrats de travail")).toBeInTheDocument();
    expect(screen.getByText("Presences")).toBeInTheDocument();
    expect(screen.getByText("Conges et absences")).toBeInTheDocument();
    expect(screen.getByText("Feuilles de temps")).toBeInTheDocument();
    expect(screen.getByText("Bulletins de paie")).toBeInTheDocument();
    expect(screen.getByText(/Aucun montant, bulletin ou element salarial/i)).toBeInTheDocument();
  });

  it("desactive les ecritures quand le scope Supabase est absent", () => {
    render(
      <OdooMappingBoard
        initialData={buildData(false)}
        upsertMappingAction={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: /Creer|Lier/i })[0]).toBeDisabled();
    expect(screen.getByText(/lecture seule/i)).toBeInTheDocument();
  });
});
