import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Home from "@/app/page";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/dashboard/admin-cockpit-data", () => ({
  loadAdminCockpitData: vi.fn(async () => ({
    source: "supabase",
    sourceMessage: "Cockpit charge.",
    range: "30d",
    rangeLabel: "30 derniers jours",
    updatedAtLabel: "maintenant",
    metrics: [],
    overviewCards: [],
    priorities: [],
    healthItems: [],
    quickActions: [],
    organizationFocus: [],
    projectFocus: [],
    loadSeries: [],
    revenueSeries: [],
    alerts: [],
    kanbanColumns: [],
  })),
}));

describe("page d'accueil AdminBTP", () => {
  it("affiche les messages de lancement attendus", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", {
        name: /Le cockpit AdminBTP devient l'ecran principal d'exploitation/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Checklist exploitation/i)).toBeInTheDocument();
    expect(screen.getByText(/production reelle/i)).toBeInTheDocument();
  });
});
