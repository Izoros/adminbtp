import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

import AdminArchivesPage from "@/app/admin/archives/page";
import { loadArchiveOperationsData } from "@/modules/archival/services/archive-operations";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/archival/services/archive-operations", () => ({
  loadArchiveOperationsData: vi.fn(),
}));

describe("page admin archives", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("n expose aucune donnee si le role plateforme est refuse", async () => {
    vi.mocked(loadArchiveOperationsData).mockResolvedValue({
      access: "forbidden",
      message: "Le journal d'archivage est reserve aux administrateurs plateforme.",
    });

    render(await AdminArchivesPage());

    expect(screen.getByText("Archives AdminBTP")).toBeInTheDocument();
    expect(screen.getByText(/reserve aux administrateurs plateforme/i)).toBeInTheDocument();
    expect(screen.queryByText("Historique des executions")).not.toBeInTheDocument();
  });

  it("affiche le journal quand le lecteur autorise retourne les donnees", async () => {
    vi.mocked(loadArchiveOperationsData).mockResolvedValue({
      access: "ready",
      data: {
        access: "ready",
        health: "empty",
        healthLabel: "Aucune execution",
        sourceMessage: "Le journal d'archivage est accessible mais encore vide.",
        updatedAt: "2026-08-12T03:00:00.000Z",
        totalRuns: 0,
        succeededRuns: 0,
        failedRuns: 0,
        stalledRuns: 0,
        lastSucceededAt: null,
        runs: [],
      },
    });

    render(await AdminArchivesPage());

    expect(screen.getByText("Historique des executions")).toBeInTheDocument();
    expect(screen.getByText("Aucune execution")).toBeInTheDocument();
  });
});
