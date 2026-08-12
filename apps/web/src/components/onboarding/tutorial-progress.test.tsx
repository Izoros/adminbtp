import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { TutorialProgress } from "@/components/onboarding/tutorial-progress";

describe("progression du didacticiel", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
      configurable: true,
    });
  });

  it("memorise les etapes cochees sans donnee metier", () => {
    render(
      <TutorialProgress
        userKey="user_guide"
        items={[
          { id: "organization", title: "Organisation" },
          { id: "project", title: "Chantier" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Organisation" }));

    expect(screen.getByText("1 etape(s) sur 2")).toBeInTheDocument();
    expect(
      window.localStorage.getItem(
        "adminbtp:onboarding:tutorial-progress:v1:user_guide",
      ),
    ).toBe('["organization"]');
  });

  it("reinitialise la progression", () => {
    render(
      <TutorialProgress
        userKey="user_guide"
        items={[{ id: "organization", title: "Organisation" }]}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Organisation" }));
    fireEvent.click(screen.getByRole("button", { name: "Reinitialiser" }));

    expect(screen.getByText("0 etape(s) sur 1")).toBeInTheDocument();
  });
});
