export type AdminCockpitMetricTone = "warm" | "ink" | "sage";

export type AdminCockpitAlertTone = "amber" | "emerald" | "rose";

export type AdminCockpitKanbanAccent = "amber" | "emerald" | "rose" | "sky";

export type AdminCockpitMetric = {
  label: string;
  value: string;
  delta: string;
  tone: AdminCockpitMetricTone;
};

export type AdminCockpitLoadPoint = {
  label: string;
  emails: number;
  documents: number;
  consulting: number;
};

export type AdminCockpitRevenuePoint = {
  label: string;
  committed: number;
  invoiced: number;
};

export type AdminCockpitAlert = {
  title: string;
  detail: string;
  tone: AdminCockpitAlertTone;
};

export type AdminCockpitKanbanCard = {
  title: string;
  meta: string;
  owner: string;
  eta: string;
};

export type AdminCockpitKanbanColumn = {
  id: string;
  title: string;
  accent: AdminCockpitKanbanAccent;
  cards: AdminCockpitKanbanCard[];
};

export type AdminCockpitData = {
  source: "demo" | "supabase";
  sourceMessage: string;
  metrics: AdminCockpitMetric[];
  loadSeries: AdminCockpitLoadPoint[];
  revenueSeries: AdminCockpitRevenuePoint[];
  alerts: AdminCockpitAlert[];
  kanbanColumns: AdminCockpitKanbanColumn[];
};
