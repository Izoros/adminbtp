import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminCockpit } from "@/components/dashboard/admin-cockpit";

describe("AdminCockpit", () => {
  it("affiche les graphes et le kanban de pilotage admin", () => {
    render(<AdminCockpit />);

    expect(screen.getByText("Charge operationnelle AdminBTP")).toBeInTheDocument();
    expect(screen.getByText("Engagement vs facture")).toBeInTheDocument();
    expect(screen.getByText("File active AdminBTP")).toBeInTheDocument();
    expect(screen.getByText("A qualifier")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });
});
