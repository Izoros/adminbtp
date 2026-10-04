import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));

import {
  ensureBootstrapAdmin,
  getBootstrapAdminEmails,
  isBootstrapAdminEmail,
} from "@/modules/auth/services/admin-bootstrap";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ADMINBTP_PLATFORM_ADMIN_EMAILS", " Admin@AdminBTP.test , second@adminbtp.test,");
  mocks.createSupabaseAdminClient.mockReturnValue({
    from: () => ({ upsert: mocks.upsert }),
  });
  mocks.upsert.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin bootstrap", () => {
  it("normalise la liste des emails declares", () => {
    expect([...getBootstrapAdminEmails()]).toEqual([
      "admin@adminbtp.test",
      "second@adminbtp.test",
    ]);
    expect(isBootstrapAdminEmail("ADMIN@adminbtp.test")).toBe(true);
    expect(isBootstrapAdminEmail("autre@adminbtp.test")).toBe(false);
    expect(isBootstrapAdminEmail(null)).toBe(false);
  });

  it("ignore les comptes non declares", async () => {
    expect(await ensureBootstrapAdmin({ id: "u1", email: "autre@adminbtp.test" })).toBe(
      "not_listed",
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("promeut un compte declare en platform_admin", async () => {
    expect(await ensureBootstrapAdmin({ id: "u1", email: "Admin@AdminBTP.test" })).toBe(
      "promoted",
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        email: "admin@adminbtp.test",
        internal_role: "platform_admin",
      }),
      { onConflict: "id" },
    );
  });

  it("ne bloque pas la connexion sans cle service", async () => {
    mocks.createSupabaseAdminClient.mockReturnValue(null);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await ensureBootstrapAdmin({ id: "u1", email: "admin@adminbtp.test" })).toBe(
      "missing_service_key",
    );
  });
});
