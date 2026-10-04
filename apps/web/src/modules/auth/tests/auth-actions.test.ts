import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
  ensureBootstrapAdmin: vi.fn(),
  isBootstrapAdminEmail: vi.fn(() => false),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/site-url", () => ({
  buildAuthCallbackUrl: vi.fn(
    async (next: string) => `https://adminbtp.test/auth/callback?next=${encodeURIComponent(next)}`,
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: mocks.auth })),
}));
vi.mock("@/modules/auth/services/admin-bootstrap", () => ({
  ensureBootstrapAdmin: mocks.ensureBootstrapAdmin,
  isBootstrapAdminEmail: mocks.isBootstrapAdminEmail,
}));

import {
  requestPasswordReset,
  sendMagicLink,
  signInWithPassword,
  signOut,
  updatePassword,
} from "@/modules/auth/services/auth-actions";

const idle = { status: "idle" as const };

function form(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isBootstrapAdminEmail.mockReturnValue(false);
});

describe("signInWithPassword", () => {
  it("connecte, promeut l'admin declare puis redirige vers la destination nettoyee", async () => {
    const user = { id: "u1", email: "admin@adminbtp.test" };
    mocks.auth.signInWithPassword.mockResolvedValue({ data: { user }, error: null });

    await expect(
      signInWithPassword(
        idle,
        form({ email: " Admin@AdminBTP.test ", password: "secret-123456", next: "/projects" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/projects");

    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@adminbtp.test",
      password: "secret-123456",
    });
    expect(mocks.ensureBootstrapAdmin).toHaveBeenCalledWith(user);
  });

  it("refuse une redirection externe", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    await expect(
      signInWithPassword(
        idle,
        form({ email: "a@b.fr", password: "x", next: "https://evil.test" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
  });

  it("affiche un message clair sur identifiants invalides et garde l'email", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials", status: 400 },
    });

    const state = await signInWithPassword(idle, form({ email: "a@b.fr", password: "bad" }));

    expect(state).toEqual({
      status: "error",
      message: "Email ou mot de passe incorrect.",
      email: "a@b.fr",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("valide les champs avant d'appeler Supabase", async () => {
    const state = await signInWithPassword(idle, form({ email: "a@b.fr", password: "" }));

    expect(state.status).toBe("error");
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("sendMagicLink", () => {
  it("n'ouvre pas de compte pour un email non declare et ne revele pas son existence", async () => {
    mocks.auth.signInWithOtp.mockResolvedValue({
      error: { code: "otp_disabled", status: 422 },
    });

    const state = await sendMagicLink(idle, form({ email: "inconnu@b.fr" }));

    expect(mocks.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "inconnu@b.fr",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://adminbtp.test/auth/callback?next=%2Fadmin",
      },
    });
    expect(state.status).toBe("success");
  });

  it("autorise la creation du compte pour un admin declare", async () => {
    mocks.isBootstrapAdminEmail.mockReturnValue(true);
    mocks.auth.signInWithOtp.mockResolvedValue({ error: null });

    await sendMagicLink(idle, form({ email: "admin@adminbtp.test" }));

    expect(mocks.auth.signInWithOtp.mock.calls[0][0].options.shouldCreateUser).toBe(true);
  });

  it("signale la limite d'envoi", async () => {
    mocks.auth.signInWithOtp.mockResolvedValue({
      error: { code: "over_email_send_rate_limit", status: 429 },
    });

    const state = await sendMagicLink(idle, form({ email: "a@b.fr" }));

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/Trop de tentatives/);
  });
});

describe("requestPasswordReset", () => {
  it("envoie le lien vers la page de mot de passe", async () => {
    mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    const state = await requestPasswordReset(idle, form({ email: "a@b.fr" }));

    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.fr", {
      redirectTo: "https://adminbtp.test/auth/callback?next=%2Faccount%2Fpassword",
    });
    expect(state.status).toBe("success");
  });
});

describe("updatePassword", () => {
  it("refuse un mot de passe trop court ou non confirme", async () => {
    expect(
      (await updatePassword(idle, form({ password: "court", confirmation: "court" }))).message,
    ).toMatch(/10 caracteres/);
    expect(
      (
        await updatePassword(
          idle,
          form({ password: "assez-long-123", confirmation: "different-123" }),
        )
      ).message,
    ).toMatch(/ne correspondent pas/);
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  it("exige une session", async () => {
    mocks.auth.getUser.mockResolvedValue({ data: { user: null } });

    const state = await updatePassword(
      idle,
      form({ password: "assez-long-123", confirmation: "assez-long-123" }),
    );

    expect(state.message).toMatch(/session a expire/);
  });

  it("enregistre le mot de passe puis confirme", async () => {
    mocks.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.auth.updateUser.mockResolvedValue({ error: null });

    await expect(
      updatePassword(idle, form({ password: "assez-long-123", confirmation: "assez-long-123" })),
    ).rejects.toThrow("NEXT_REDIRECT:/account/password?status=password_updated");
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({ password: "assez-long-123" });
  });
});

describe("signOut", () => {
  it("ferme la session et renvoie vers /login", async () => {
    mocks.auth.signOut.mockResolvedValue({ error: null });

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/login?status=signed_out");
    expect(mocks.auth.signOut).toHaveBeenCalled();
  });
});
