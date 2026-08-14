import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Home from "@/app/page";

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}));

describe("page d'accueil AdminBTP", () => {
  it("affiche la connexion, la presentation, le vlog et le credit createur", async () => {
    render(await Home({}));

    expect(
      screen.getByRole("heading", {
        name: /Le chantier avance. L'administratif aussi/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Connexion a votre espace/i })).toBeInTheDocument();
    expect(screen.getByText(/Les projets racontes simplement/i)).toBeInTheDocument();
    expect(screen.getByText("Create and design par FAST976.yt")).toBeInTheDocument();
  });

  it("permet de parcourir les visuels d'architecture", async () => {
    render(await Home({}));

    expect(screen.getByText("Equipement public bioclimatique")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Image suivante" }));
    expect(screen.getByText("Du plan au dossier technique")).toBeInTheDocument();
  });

  it("affiche une erreur de connexion visible avant les champs", async () => {
    render(
      await Home({
        searchParams: Promise.resolve({ errorCode: "invalid_credentials" }),
      }),
    );

    const alert = screen.getByRole("alert");
    const emailInput = screen.getByLabelText("Email professionnel");

    expect(alert).toHaveTextContent("Identifiants invalides ou compte indisponible.");
    expect(alert).toHaveClass("border-red-400", "bg-red-100", "text-red-950");
    expect(alert.compareDocumentPosition(emailInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
