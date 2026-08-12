export type MarketArchivePayload = {
  metadata: {
    archiveVersion: number;
    generatedAt: string;
    retentionYears: number;
    environment: string;
    organizationCount: number;
    projectCount: number;
    documentCount: number;
    signatureCount: number;
    situationCount: number;
    followupCount: number;
    consultingMissionCount: number;
    technicalReviewCount: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    legalName?: string | null;
    isActive: boolean;
  }>;
  projects: Array<Record<string, unknown>>;
  documentTemplates: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  signatures: Array<Record<string, unknown>>;
  situations: Array<Record<string, unknown>>;
  followups: Array<Record<string, unknown>>;
  consultingMissions: Array<Record<string, unknown>>;
  consultingHours: Array<Record<string, unknown>>;
  expertRequests: Array<Record<string, unknown>>;
  technicalReviews: Array<Record<string, unknown>>;
};

export type MarketArchiveDigest = {
  sha256: string;
  byteLength: number;
};

export type MarketArchiveVerificationStatus =
  | "not_applicable"
  | "pending"
  | "verified"
  | "failed";

export type MarketArchiveVerification = MarketArchiveDigest & {
  status: Extract<MarketArchiveVerificationStatus, "verified">;
  verifiedAt: string;
};

export type MarketArchiveStorageTarget =
  | {
      mode: "disabled";
    }
  | {
      mode: "local";
      localDirectory: string;
    }
  | {
      mode: "sftp";
      host: string;
      port: number;
      username: string;
      password?: string;
      privateKey?: string;
      remoteBasePath: string;
    };

export type MarketArchiveResult = {
  ok: boolean;
  mode: MarketArchiveStorageTarget["mode"];
  runId?: string;
  generatedAt: string;
  fileName: string;
  remotePath?: string;
  localPath?: string;
  sha256: string;
  byteLength: number;
  verificationStatus: MarketArchiveVerificationStatus;
  verifiedAt?: string;
  summary: {
    organizations: number;
    projects: number;
    documents: number;
    signatures: number;
    situations: number;
    followups: number;
    consultingMissions: number;
    technicalReviews: number;
  };
  skippedReason?: string;
};
