import { describe, expect, it, vi } from "vitest";

import {
  buildOdooConnectionReadiness,
  probeOdooConnection,
  resolveOdooConnectionConfig,
} from "@/modules/settings/services/odoo-connector";

const activeEnvironment = {
  ADMINBTP_ODOO_ENABLED: "true",
  ADMINBTP_ODOO_BASE_URL: "https://odoo.company.invalid/web",
  ADMINBTP_ODOO_DATABASE: "adminbtp-db",
  ADMINBTP_ODOO_API_KEY: "odoo-secret-never-rendered",
  ADMINBTP_ODOO_ALLOWED_HOSTS: "odoo.company.invalid",
};

describe("connecteur Odoo JSON-2", () => {
  it("reste inactif par defaut", () => {
    expect(resolveOdooConnectionConfig({})).toMatchObject({ mode: "inactive" });
    expect(buildOdooConnectionReadiness({})).toMatchObject({
      status: "inactive",
      statusLabel: "Desactive",
    });
  });

  it("refuse une destination locale meme placee en liste blanche", () => {
    expect(
      resolveOdooConnectionConfig({
        ...activeEnvironment,
        ADMINBTP_ODOO_BASE_URL: "https://127.0.0.1:8069",
        ADMINBTP_ODOO_ALLOWED_HOSTS: "127.0.0.1",
      }),
    ).toMatchObject({ mode: "invalid" });
  });

  it("ne restitue aucune valeur de connexion dans le modele de vue", () => {
    const serialized = JSON.stringify(
      buildOdooConnectionReadiness(activeEnvironment),
    );

    expect(serialized).not.toContain("odoo.company.invalid");
    expect(serialized).not.toContain("adminbtp-db");
    expect(serialized).not.toContain("odoo-secret-never-rendered");
  });

  it("utilise le contrat officiel JSON-2 avec une cle Bearer", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      probeOdooConnection({ environment: activeEnvironment, fetcher }),
    ).resolves.toEqual({ ok: true });

    expect(fetcher).toHaveBeenCalledWith(
      "https://odoo.company.invalid/json/2/res.partner/search_read",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer odoo-secret-never-rendered",
          "x-odoo-database": "adminbtp-db",
        }),
      }),
    );
  });
});
