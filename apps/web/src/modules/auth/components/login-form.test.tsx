import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getSupabaseProjectRef: () => "test-project",
  hasSupabaseConfig: () => true,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: mocks.createClient,
}));

import { LoginForm } from "@/modules/auth/components/login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword,
      },
    });
  });

  it("signale les identifiants invalides sans lancer une navigation serveur", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: new Error("invalid credentials"),
    });

    render(<LoginForm nextPath="/admin" loginPath="/" />);

    fireEvent.change(screen.getByLabelText("Email professionnel"), {
      target: { value: "ADMIN@FAST976.YT" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "mot-de-passe-test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "admin@fast976.yt",
        password: "mot-de-passe-test",
      });
    });
    expect(
      screen.getByText("Email ou mot de passe incorrect."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
  });
});
