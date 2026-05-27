import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Home from "@/app/page";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("page d'accueil AdminBTP", () => {
  it("affiche les messages de lancement attendus", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /AdminBTP prend forme comme une plateforme modulaire BTP/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Validation de phase/i)).toBeInTheDocument();
    expect(screen.getByText(/CRUD reels/i)).toBeInTheDocument();
  });
});
