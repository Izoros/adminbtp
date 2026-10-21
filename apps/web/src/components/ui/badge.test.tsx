import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge tone="success">Validé</Badge>);
    expect(screen.getByText("Validé")).toBeTruthy();
  });

  it("applies the tone's color classes", () => {
    render(<Badge tone="danger">Refusé</Badge>);
    expect(screen.getByText("Refusé").className).toContain("text-status-danger");
  });
});
