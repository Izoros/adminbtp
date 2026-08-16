import type {
  OpcDependency,
  OpcTask,
  OpcWorkspaceSnapshot,
} from "@/modules/opc/domain/types";

const projectId = "opc-project-48-logements";

function task(
  id: string,
  name: string,
  plannedStart: string,
  plannedEnd: string,
  durationDays: number,
  input: Partial<OpcTask> = {},
): OpcTask {
  return {
    id,
    projectId,
    code: id.toUpperCase(),
    name,
    plannedStart,
    plannedEnd,
    durationDays,
    progressMode: "manual",
    progressPercent: 0,
    weight: 1,
    status: "not_started",
    priority: "normal",
    zoneIds: [],
    isMilestone: false,
    isContractualMilestone: false,
    ...input,
  };
}

export const fortyEightHomesTasks: OpcTask[] = [
  task("t01", "Installation de chantier", "2026-09-01", "2026-09-07", 7, {
    lotId: "lot-00",
    companyId: "company-tce",
    zoneIds: ["zone-site"],
    progressPercent: 100,
    status: "completed",
    weight: 2,
  }),
  task("t02", "Terrassements generaux", "2026-09-08", "2026-09-21", 14, {
    lotId: "lot-01",
    companyId: "company-gros-oeuvre",
    zoneIds: ["zone-site"],
    progressPercent: 75,
    status: "in_progress",
    weight: 4,
  }),
  task("t03", "Fondations batiment A", "2026-09-22", "2026-10-12", 21, {
    lotId: "lot-01",
    companyId: "company-gros-oeuvre",
    zoneIds: ["zone-a"],
    weight: 7,
  }),
  task("t04", "Fondations batiment B", "2026-09-22", "2026-10-12", 21, {
    lotId: "lot-01",
    companyId: "company-gros-oeuvre",
    zoneIds: ["zone-b"],
    weight: 7,
  }),
  task("t05", "Superstructure batiment A", "2026-10-13", "2026-11-23", 42, {
    lotId: "lot-01",
    companyId: "company-gros-oeuvre",
    zoneIds: ["zone-a"],
    weight: 10,
  }),
  task("t06", "Superstructure batiment B", "2026-10-13", "2026-11-23", 42, {
    lotId: "lot-01",
    companyId: "company-gros-oeuvre",
    zoneIds: ["zone-b"],
    weight: 10,
  }),
  task("t07", "Hors d'eau", "2026-11-24", "2026-12-21", 28, {
    lotId: "lot-02",
    companyId: "company-etancheite",
    zoneIds: ["zone-a", "zone-b"],
    weight: 7,
  }),
  task("m01", "Jalon contractuel hors d'eau", "2026-12-22", "2026-12-22", 0, {
    isMilestone: true,
    isContractualMilestone: true,
    priority: "urgent",
  }),
  task("t08", "Menuiseries exterieures", "2026-12-22", "2027-01-18", 28, {
    lotId: "lot-03",
    companyId: "company-menuiserie",
    zoneIds: ["zone-a", "zone-b"],
    weight: 6,
  }),
  task("t09", "Reseaux plomberie", "2027-01-05", "2027-02-01", 28, {
    lotId: "lot-05",
    companyId: "company-fluides",
    zoneIds: ["zone-a"],
    weight: 6,
  }),
  task("t10", "Reseaux electricite", "2027-01-05", "2027-02-01", 28, {
    lotId: "lot-06",
    companyId: "company-electricite",
    zoneIds: ["zone-a"],
    weight: 6,
  }),
  task("t11", "Cloisons et doublages", "2027-02-02", "2027-03-01", 28, {
    lotId: "lot-04",
    companyId: "company-second-oeuvre",
    zoneIds: ["zone-a", "zone-b"],
    weight: 8,
  }),
  task("t12", "Carrelage et faience", "2027-03-02", "2027-03-29", 28, {
    lotId: "lot-07",
    companyId: "company-finitions",
    zoneIds: ["zone-a", "zone-b"],
    weight: 6,
  }),
  task("t13", "Peintures", "2027-03-16", "2027-04-12", 28, {
    lotId: "lot-08",
    companyId: "company-finitions",
    zoneIds: ["zone-a", "zone-b"],
    weight: 6,
  }),
  task("t14", "Essais et mises en service", "2027-04-13", "2027-04-26", 14, {
    lotId: "lot-09",
    companyId: "company-tce",
    zoneIds: ["zone-a", "zone-b"],
    weight: 5,
  }),
  task("m02", "Reception contractuelle", "2027-04-27", "2027-04-27", 0, {
    isMilestone: true,
    isContractualMilestone: true,
    priority: "urgent",
  }),
];

export const fortyEightHomesDependencies: OpcDependency[] = [
  ["d01", "t01", "t02", "FS", 0],
  ["d02", "t02", "t03", "FS", 0],
  ["d03", "t02", "t04", "FS", 0],
  ["d04", "t03", "t05", "FS", 0],
  ["d05", "t04", "t06", "FS", 0],
  ["d06", "t05", "t07", "FS", 0],
  ["d07", "t06", "t07", "FS", 0],
  ["d08", "t07", "m01", "FS", 0],
  ["d09", "m01", "t08", "FS", 0],
  ["d10", "t08", "t09", "SS", 14],
  ["d11", "t08", "t10", "SS", 14],
  ["d12", "t09", "t11", "FS", 0],
  ["d13", "t10", "t11", "FS", 0],
  ["d14", "t11", "t12", "FS", 0],
  ["d15", "t12", "t13", "SS", 14],
  ["d16", "t13", "t14", "FS", 0],
  ["d17", "t14", "m02", "FS", 0],
].map(([id, predecessorId, successorId, type, lagDays]) => ({
  id: String(id),
  predecessorId: String(predecessorId),
  successorId: String(successorId),
  type: type as OpcDependency["type"],
  lagDays: Number(lagDays),
}));

export const fortyEightHomesFixture: OpcWorkspaceSnapshot = {
  project: {
    id: projectId,
    code: "MAM-48-LOGTS",
    name: "Construction de 48 logements a Mamoudzou",
    startsOn: "2026-09-01",
    endsOn: "2027-04-27",
  },
  tasks: fortyEightHomesTasks,
  dependencies: fortyEightHomesDependencies,
  actions: [],
  prerequisites: [],
  delays: [],
  reservations: [],
  receptions: [],
  lots: [],
  zones: [],
  meetings: [],
  planningVersions: [],
};
