export type OpcDependencyType = "FS" | "SS" | "FF" | "SF";

export type OpcTaskStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";

export type OpcProgressMode = "manual" | "quantitative" | "unit";

export type OpcTask = {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description?: string;
  plannedStart: string;
  plannedEnd: string;
  currentStart?: string;
  currentEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  durationDays: number;
  progressMode: OpcProgressMode;
  progressPercent: number;
  plannedQuantity?: number;
  completedQuantity?: number;
  unitLabel?: string;
  weight: number;
  status: OpcTaskStatus;
  priority: "low" | "normal" | "high" | "urgent";
  lotId?: string;
  zoneIds: string[];
  companyId?: string;
  phaseId?: string;
  ownerUserId?: string;
  isMilestone: boolean;
  isContractualMilestone: boolean;
  constraintStart?: string;
  notes?: string;
};

export type OpcDependency = {
  id: string;
  predecessorId: string;
  successorId: string;
  type: OpcDependencyType;
  lagDays: number;
};

export type OpcScheduleResult = {
  taskId: string;
  earliestStartOffset: number;
  earliestFinishOffset: number;
  latestStartOffset: number;
  latestFinishOffset: number;
  totalFloatDays: number;
  freeFloatDays: number;
  isCritical: boolean;
  isQuasiCritical: boolean;
  calculatedStart: string;
  calculatedEnd: string;
};

export type OpcAction = {
  id: string;
  projectId: string;
  title: string;
  dueOn: string;
  status: "open" | "in_progress" | "done" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  assigneeUserId?: string;
  assigneeOrganizationId?: string;
  taskId?: string;
  meetingId?: string;
};

export type OpcPrerequisite = {
  id: string;
  taskId: string;
  label: string;
  category: "study" | "material" | "access" | "decision" | "safety" | "other";
  requiredOn?: string;
  status: "missing" | "requested" | "available" | "waived";
};

export type OpcDelayEvent = {
  id: string;
  taskId: string;
  cause: string;
  causeCategory:
    | "company"
    | "client"
    | "design"
    | "weather"
    | "supply"
    | "administrative"
    | "interface"
    | "other";
  delayDays: number;
  occurredOn: string;
  responsibilityOrganizationId?: string;
};

export type OpcReservation = {
  id: string;
  projectId: string;
  title: string;
  dueOn?: string;
  status: "open" | "corrected" | "verified" | "closed";
  severity: "minor" | "major" | "blocking";
  lotId?: string;
  zoneId?: string;
  companyId?: string;
};

export type OpcWorkspaceSnapshot = {
  project: {
    id: string;
    code: string;
    name: string;
    startsOn?: string;
    endsOn?: string;
  };
  tasks: OpcTask[];
  dependencies: OpcDependency[];
  actions: OpcAction[];
  prerequisites: OpcPrerequisite[];
  delays: OpcDelayEvent[];
  reservations: OpcReservation[];
  receptions: Array<{
    id: string;
    title: string;
    receptionType: string;
    plannedOn?: string;
    pronouncedOn?: string;
    status: string;
  }>;
  lots: Array<{ id: string; code: string; name: string; companyId?: string }>;
  zones: Array<{ id: string; code: string; name: string; parentId?: string }>;
  meetings: Array<{
    id: string;
    title: string;
    meetingType: string;
    scheduledAt: string;
    status: string;
  }>;
  planningVersions: Array<{
    id: string;
    name: string;
    versionNumber: number;
    isBaseline: boolean;
    createdAt: string;
  }>;
};
