import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/archival/services/market-archive", () => ({
  runMarketArchiveBackup: vi.fn(),
}));

import { GET } from "@/app/api/cron/market-archive/route";
import { runMarketArchiveBackup } from "@/modules/archival/services/market-archive";

describe("market-archive-route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = "secret_archivage";
  });

  it("refuse un appel sans jeton cron", async () => {
    const request = new Request("https://adminbtp.vercel.app/api/cron/market-archive");
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it("declenche l archivage si le bearer cron est valide", async () => {
    vi.mocked(runMarketArchiveBackup).mockResolvedValue({
      ok: true,
      mode: "local",
      generatedAt: "2026-05-25T12:00:00.000Z",
      fileName: "market-archive-2026-05-25T12-00-00-000Z.json.gz",
      localPath: ".archives/market-archive/2026/05/25/archive.json.gz",
      sha256: "abc123",
      byteLength: 512,
      summary: {
        organizations: 1,
        projects: 2,
        documents: 3,
        signatures: 4,
        situations: 5,
        followups: 6,
        consultingMissions: 7,
        technicalReviews: 8,
      },
    });

    const request = new Request("https://adminbtp.vercel.app/api/cron/market-archive", {
      headers: {
        authorization: "Bearer secret_archivage",
      },
    });
    const response = await GET(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(vi.mocked(runMarketArchiveBackup)).toHaveBeenCalledOnce();
  });
});
