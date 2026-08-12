import { render, screen } from "@testing-library/react";

import { ArchiveOperationsDashboard } from "@/modules/archival/components/archive-operations-dashboard";
import type { ArchiveOperationsData } from "@/modules/archival/types/archive-operations";

const data: ArchiveOperationsData = {
  access: "ready",
  health: "critical",
  healthLabel: "Intervention requise",
  sourceMessage: "2 executions d'archive chargees depuis Supabase.",
  updatedAt: "2026-08-12T03:00:00.000Z",
  totalRuns: 2,
  succeededRuns: 1,
  failedRuns: 1,
  stalledRuns: 0,
  lastSucceededAt: "2026-08-11T01:17:00.000Z",
  runs: [
    {
      id: "run_failed",
      status: "failed",
      verificationStatus: "failed",
      storageMode: "sftp",
      generatedAt: "2026-08-12T01:17:00.000Z",
      completedAt: "2026-08-12T01:18:00.000Z",
      verifiedAt: null,
      fileName: "market-archive-failed.json.gz",
      storagePath: "/adminbtp/archives/2026/08/12/archive.json.gz",
      sha256: null,
      byteLength: null,
      errorMessage: "SFTP indisponible",
      isStalled: false,
    },
  ],
};

describe("ArchiveOperationsDashboard", () => {
  it("affiche l etat critique et l erreur d exploitation", () => {
    render(<ArchiveOperationsDashboard data={data} />);

    expect(screen.getByText("Intervention requise")).toBeInTheDocument();
    expect(screen.getByText("SFTP indisponible")).toBeInTheDocument();
    expect(screen.getByText("market-archive-failed.json.gz")).toBeInTheDocument();
    expect(screen.getByText("Echec")).toBeInTheDocument();
  });
});
