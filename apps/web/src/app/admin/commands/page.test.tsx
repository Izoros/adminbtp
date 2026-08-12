import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

import AdminCommandsPage from "@/app/admin/commands/page";
import { loadWhatsAppCommandQueue } from "@/modules/whatsapp/services/command-operations";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/modules/whatsapp/services/command-operations", () => ({
  loadWhatsAppCommandQueue: vi.fn(),
}));

describe("page admin commandes WhatsApp", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("n expose aucune commande si le role plateforme est refuse", async () => {
    vi.mocked(loadWhatsAppCommandQueue).mockResolvedValue({
      access: "forbidden",
      message: "La file WhatsApp est reservee aux administrateurs plateforme.",
    });

    render(await AdminCommandsPage());

    expect(screen.getByText("Commandes WhatsApp")).toBeInTheDocument();
    expect(screen.getByText(/reservee aux administrateurs plateforme/i)).toBeInTheDocument();
    expect(screen.queryByText("Revue des demandes")).not.toBeInTheDocument();
  });

  it("affiche la file autorisee et rappelle la validation humaine", async () => {
    vi.mocked(loadWhatsAppCommandQueue).mockResolvedValue({
      access: "ready",
      data: {
        updatedAt: "2026-08-12T08:00:00.000Z",
        sourceMessage: "La file WhatsApp est accessible.",
        totalCommands: 0,
        pendingCommands: 0,
        completedCommands: 0,
        failedCommands: 0,
        commands: [],
      },
    });

    render(await AdminCommandsPage());

    expect(screen.getByText("Revue des demandes")).toBeInTheDocument();
    expect(screen.getByText(/validation humaine/i)).toBeInTheDocument();
    expect(screen.getByText(/Aucune commande WhatsApp/i)).toBeInTheDocument();
  });
});
