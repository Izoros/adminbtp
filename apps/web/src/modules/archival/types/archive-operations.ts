export type ArchiveRunStatus = "running" | "succeeded" | "failed";

export type ArchiveVerificationStatus = "pending" | "verified" | "failed";

export type ArchiveOperationsHealth =
  | "healthy"
  | "attention"
  | "critical"
  | "empty"
  | "unavailable";

export type ArchiveRunView = {
  id: string;
  status: ArchiveRunStatus;
  verificationStatus: ArchiveVerificationStatus;
  storageMode: "local" | "sftp";
  generatedAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
  fileName: string;
  storagePath: string;
  sha256: string | null;
  byteLength: number | null;
  errorMessage: string | null;
  isStalled: boolean;
};

export type ArchiveOperationsData = {
  access: "ready" | "unavailable";
  health: ArchiveOperationsHealth;
  healthLabel: string;
  sourceMessage: string;
  updatedAt: string;
  totalRuns: number;
  succeededRuns: number;
  failedRuns: number;
  stalledRuns: number;
  lastSucceededAt: string | null;
  runs: ArchiveRunView[];
};

export type ArchiveOperationsAccessResult =
  | {
      access: "ready";
      data: ArchiveOperationsData;
    }
  | {
      access: "unauthenticated" | "forbidden" | "unavailable";
      message: string;
    };
