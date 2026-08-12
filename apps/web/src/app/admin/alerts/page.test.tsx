import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

import AdminAlertsPage from "@/app/admin/alerts/page";
import { loadOperationsAlertsData } from "@/modules/archival/services/operations-alerts-admin";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/archival/services/operations-alerts-admin", () => ({
  loadOperationsAlertsData: vi.fn(),
}));

describe("page admin alertes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("masque l outbox si le role plateforme est refuse", async () => {
    vi.mocked(loadOperationsAlertsData).mockResolvedValue({
      access: "forbidden",
      message: "Les alertes sont reservees aux administrateurs plateforme.",
    });

    render(await AdminAlertsPage());

    expect(screen.getByText("Alertes AdminBTP")).toBeInTheDocument();
    expect(screen.getByText(/reservees aux administrateurs plateforme/i)).toBeInTheDocument();
    expect(screen.queryByText("Historique des livraisons")).not.toBeInTheDocument();
  });

  it("affiche l historique autorise sans donnees sensibles", async () => {
    vi.mocked(loadOperationsAlertsData).mockResolvedValue({
      access: "ready",
      data: {
        updatedAt: "2026-08-12T04:00:00.000Z",
        sourceMessage: "L'outbox est accessible.",
        totalAlerts: 0,
        deliveredAlerts: 0,
        failedAlerts: 0,
        activeAlerts: 0,
        alerts: [],
      },
    });

    render(await AdminAlertsPage());

    expect(screen.getByText("Historique des livraisons")).toBeInTheDocument();
    expect(screen.getByText(/donnees sensibles/i)).toBeInTheDocument();
    expect(screen.getByText(/Aucune alerte/i)).toBeInTheDocument();
  });
});
