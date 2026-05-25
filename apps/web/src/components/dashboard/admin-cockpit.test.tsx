import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminCockpit } from "@/components/dashboard/admin-cockpit";

describe("AdminCockpit", () => {
  it("affiche les graphes et le kanban de pilotage admin", () => {
    render(<AdminCockpit />);

    expect(screen.getByText("Charge operationnelle AdminBTP")).toBeInTheDocument();
    expect(screen.getByText("Engagement vs facture")).toBeInTheDocument();
    expect(screen.getByText("File active AdminBTP")).toBeInTheDocument();
    expect(screen.getByText("Decider vite")).toBeInTheDocument();
    expect(screen.getByText("Radar socle")).toBeInTheDocument();
    expect(screen.getByText("Basculer en execution")).toBeInTheDocument();
    expect(screen.getByText("Organisations sous charge")).toBeInTheDocument();
    expect(screen.getByText("Projets les plus exposes")).toBeInTheDocument();
    expect(screen.getByText("A qualifier")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });
});
