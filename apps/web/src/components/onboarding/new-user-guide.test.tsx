import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewUserGuide } from "@/components/onboarding/new-user-guide";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("NewUserGuide", () => {
  const storageKey = "adminbtp:onboarding:new-user-guide:user_123";
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        clear: () => {
          storage.clear();
        },
      },
      configurable: true,
    });
  });

  it("affiche la pop-in pour un nouvel utilisateur", async () => {
    render(<NewUserGuide userId="user_123" userLabel="izoro" />);

    await waitFor(() => {
      expect(screen.getByText(/Bienvenue izoro dans AdminBTP/i)).toBeInTheDocument();
    });
  });

  it("memorise la fermeture du guide", async () => {
    render(<NewUserGuide userId="user_123" userLabel="izoro" />);

    await waitFor(() => {
      expect(screen.getByText(/Demarrage rapide/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /J'ai compris/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Demarrage rapide/i)).not.toBeInTheDocument();
    });

    expect(window.localStorage.getItem(storageKey)).toBeTruthy();
  });

  it("propose le didacticiel permanent", async () => {
    render(<NewUserGuide userId="user_123" userLabel="izoro" />);

    expect(
      await screen.findByRole("link", { name: /Voir le didacticiel complet/i }),
    ).toHaveAttribute("href", "/guide");
  });
});
