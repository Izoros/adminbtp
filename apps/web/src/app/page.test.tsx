import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Home from "@/app/page";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(async () => null as { id: string } | null),
}));

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

describe("page d'accueil AdminBTP", () => {
  it("affiche la presentation, le vlog, le credit createur et renvoie vers /login", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", {
        name: /Le chantier avance. L'administratif aussi/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Connexion a votre espace/i })).toBeInTheDocument();
    expect(screen.getByText(/Les projets racontes simplement/i)).toBeInTheDocument();
    expect(screen.getByText("Create and design par FAST976.yt")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Se connecter/i }).every(
        (link) => link.getAttribute("href") === "/login",
      ),
    ).toBe(true);
  });

  it("propose d'ouvrir le cockpit quand la session est active", async () => {
    mocks.getAuthenticatedUser.mockResolvedValueOnce({ id: "user-1" });
    render(await Home());

    expect(screen.getByRole("link", { name: /Acceder au cockpit/i })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("permet de parcourir les visuels d'architecture", async () => {
    render(await Home());

    expect(screen.getByText("Equipement public bioclimatique")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Image suivante" }));
    expect(screen.getByText("Du plan au dossier technique")).toBeInTheDocument();
  });
});
