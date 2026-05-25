import { describe, expect, it } from "vitest";

import {
  buildMarketArchiveDigest,
  buildMarketArchiveFileName,
  buildMarketArchiveRemotePath,
  compressMarketArchivePayload,
  resolveMarketArchiveRetentionYears,
  resolveMarketArchiveStorageTarget,
  serializeMarketArchivePayload,
} from "@/modules/archival/services/market-archive";

describe("market-archive-service", () => {
  it("construit un nom d archive stable", () => {
    const fileName = buildMarketArchiveFileName("2026-05-25T12:34:56.789Z");
    expect(fileName).toBe("market-archive-2026-05-25T12-34-56-789Z.json.gz");
  });

  it("construit un chemin distant classe par annee et jour", () => {
    const remotePath = buildMarketArchiveRemotePath(
      "2026-05-25T12:34:56.789Z",
      "archive.json.gz",
      "/adminbtp/archives",
    );

    expect(remotePath).toBe("/adminbtp/archives/2026/05/25/archive.json.gz");
  });

  it("serialise et compresse une charge archivee", () => {
    const buffer = compressMarketArchivePayload(
      serializeMarketArchivePayload({
        metadata: {
          archiveVersion: 1,
          generatedAt: "2026-05-25T12:34:56.789Z",
          retentionYears: 25,
          environment: "test",
          organizationCount: 1,
          projectCount: 0,
          documentCount: 0,
          signatureCount: 0,
          situationCount: 0,
          followupCount: 0,
          consultingMissionCount: 0,
          technicalReviewCount: 0,
        },
        organizations: [],
        projects: [],
        documentTemplates: [],
        documents: [],
        signatures: [],
        situations: [],
        followups: [],
        consultingMissions: [],
        consultingHours: [],
        expertRequests: [],
        technicalReviews: [],
      }),
    );

    const digest = buildMarketArchiveDigest(buffer);

    expect(buffer.byteLength).toBeGreaterThan(40);
    expect(digest.sha256).toHaveLength(64);
  });

  it("retombe sur un mode desactive si l archivage n est pas active", () => {
    delete process.env.MARKET_ARCHIVE_ENABLED;
    const target = resolveMarketArchiveStorageTarget();
    expect(target.mode).toBe("disabled");
  });

  it("lit une retention valide ou retombe sur 25 ans", () => {
    process.env.MARKET_ARCHIVE_RETENTION_YEARS = "25";
    expect(resolveMarketArchiveRetentionYears()).toBe(25);

    process.env.MARKET_ARCHIVE_RETENTION_YEARS = "0";
    expect(resolveMarketArchiveRetentionYears()).toBe(25);
  });
});
