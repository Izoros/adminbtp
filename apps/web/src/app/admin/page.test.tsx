import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import AdminPage from "@/app/admin/page";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock("@/components/dashboard/admin-cockpit-data", () => ({
  loadAdminCockpitData: vi.fn(async () => ({
    source: "supabase",
    sourceMessage: "1 organisation consolidee dans le cockpit admin.",
    range: "90d",
    rangeLabel: "90 derniers jours",
    updatedAtLabel: "25 mai, 09:30",
    metrics: [],
    overviewCards: [],
    loadSeries: [],
    revenueSeries: [],
    alerts: [],
    kanbanColumns: [],
  })),
}));

describe("page admin", () => {
  it("affiche le cockpit admin et son titre dedie", async () => {
    render(await AdminPage({ searchParams: Promise.resolve({ range: "90d" }) }));

    expect(screen.getByText("Cockpit admin")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Piloter AdminBTP comme un centre d.?operations BTP/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("File active AdminBTP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "90 jours" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Surveiller les archives/i }),
    ).toHaveAttribute("href", "/admin/archives");
    expect(
      screen.getByRole("link", { name: /Commandes WhatsApp/i }),
    ).toHaveAttribute("href", "/admin/commands");
    expect(
      screen.getByRole("link", { name: /Alertes exploitation/i }),
    ).toHaveAttribute("href", "/admin/alerts");
  });
});
