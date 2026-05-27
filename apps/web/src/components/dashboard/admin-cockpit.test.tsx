import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminCockpit } from "@/components/dashboard/admin-cockpit";

describe("AdminCockpit", () => {
  it("affiche un etat vide coherent sans donnees cockpit", () => {
    render(<AdminCockpit />);

    expect(screen.getByText("Supabase")).toBeInTheDocument();
    expect(
      screen.getByText("Aucun indicateur admin n'est encore disponible pour ce perimetre."),
    ).toBeInTheDocument();
  });
});
