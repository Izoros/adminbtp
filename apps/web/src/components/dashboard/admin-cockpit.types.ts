export type AdminCockpitMetricTone = "warm" | "ink" | "sage";

export type AdminCockpitAlertTone = "amber" | "emerald" | "rose";

export type AdminCockpitKanbanAccent = "amber" | "emerald" | "rose" | "sky";

export type AdminCockpitTimeRange = "7d" | "30d" | "90d";

export type AdminCockpitMetric = {
  label: string;
  value: string;
  delta: string;
  tone: AdminCockpitMetricTone;
};

export type AdminCockpitOverviewCard = {
  title: string;
  value: string;
  detail: string;
  tone: AdminCockpitMetricTone;
};

export type AdminCockpitPriority = {
  title: string;
  detail: string;
  emphasis: string;
  tone: AdminCockpitAlertTone;
};

export type AdminCockpitHealthItem = {
  label: string;
  value: string;
  detail: string;
  tone: AdminCockpitMetricTone;
};

export type AdminCockpitQuickAction = {
  label: string;
  href: string;
  detail: string;
  tone: AdminCockpitMetricTone;
};

export type AdminCockpitPortfolioItem = {
  title: string;
  subtitle: string;
  stat: string;
  detail: string;
  tone: AdminCockpitMetricTone;
  href?: string;
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
  source: "supabase";
  sourceMessage: string;
  range: AdminCockpitTimeRange;
  rangeLabel: string;
  updatedAtLabel: string;
  metrics: AdminCockpitMetric[];
  overviewCards: AdminCockpitOverviewCard[];
  priorities: AdminCockpitPriority[];
  healthItems: AdminCockpitHealthItem[];
  quickActions: AdminCockpitQuickAction[];
  organizationFocus: AdminCockpitPortfolioItem[];
  projectFocus: AdminCockpitPortfolioItem[];
  loadSeries: AdminCockpitLoadPoint[];
  revenueSeries: AdminCockpitRevenuePoint[];
  alerts: AdminCockpitAlert[];
  kanbanColumns: AdminCockpitKanbanColumn[];
};
