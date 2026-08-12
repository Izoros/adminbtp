import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

import AdminReadinessPage from "@/app/admin/readiness/page";
import { loadIntegrationReadiness } from "@/modules/settings/services/integration-readiness";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/settings/services/integration-readiness", () => ({
  loadIntegrationReadiness: vi.fn(),
}));

describe("page de preparation des integrations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("masque la configuration au non administrateur plateforme", async () => {
    vi.mocked(loadIntegrationReadiness).mockResolvedValue({
      access: "forbidden",
      message: "Reserve aux administrateurs plateforme.",
    });

    render(await AdminReadinessPage());

    expect(screen.getByText("Etat des connexions")).toBeInTheDocument();
    expect(screen.getByText(/Reserve aux administrateurs plateforme/i)).toBeInTheDocument();
    expect(screen.queryByText(/integration\(s\) sur/i)).not.toBeInTheDocument();
  });

  it("affiche uniquement les indicateurs de presence autorises", async () => {
    vi.mocked(loadIntegrationReadiness).mockResolvedValue({
      access: "ready",
      data: {
        updatedAt: "2026-08-12T05:00:00.000Z",
        readyGroups: 1,
        totalGroups: 1,
        groups: [
          {
            id: "supabase",
            title: "Supabase",
            description: "Variables presentes uniquement.",
            status: "ready",
            statusLabel: "Pret a tester",
            checks: [
              {
                label: "URL du projet",
                ready: true,
                detail: "Variable presente",
              },
            ],
          },
        ],
      },
    });

    render(await AdminReadinessPage());

    expect(screen.getByText("1 integration(s) sur 1 prete(s) a tester")).toBeInTheDocument();
    expect(screen.getByText("Variable presente")).toBeInTheDocument();
    expect(screen.getByText(/aucun secret/i)).toBeInTheDocument();
  });
});
