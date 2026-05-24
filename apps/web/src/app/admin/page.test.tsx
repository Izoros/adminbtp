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

describe("page admin", () => {
  it("affiche le cockpit admin et son titre dedie", () => {
    render(<AdminPage />);

    expect(screen.getByText("Cockpit admin")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Piloter AdminBTP comme un centre d.?operations BTP/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("File active AdminBTP")).toBeInTheDocument();
  });
});
