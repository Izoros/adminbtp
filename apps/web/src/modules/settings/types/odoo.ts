export type OdooBindingType =
  | "customer"
  | "invoice"
  | "subscription"
  | "consulting_service"
  | "employee"
  | "employment_contract"
  | "attendance"
  | "time_off"
  | "timesheet"
  | "payslip";

export type OdooSocialBindingType = Extract<
  OdooBindingType,
  | "employee"
  | "employment_contract"
  | "attendance"
  | "time_off"
  | "timesheet"
  | "payslip"
>;

export type OdooConnectionReadiness = {
  status: "inactive" | "attention" | "ready";
  statusLabel: string;
  checks: Array<{ label: string; ready: boolean; detail: string }>;
};

export type OdooMapping = {
  id: string;
  organizationId: string;
  bindingType: OdooBindingType;
  adminbtpEntityId: string;
  odooModel: string;
  odooRecordId: string;
  syncStatus: string;
};

export type OdooDataOrigin = "supabase";

export type OdooMappingBoardData = {
  organizationId: string;
  customerMapping?: OdooMapping;
  invoiceMappings: OdooMapping[];
  subscriptionMappings: OdooMapping[];
  consultingMappings: OdooMapping[];
  socialMappings: Record<OdooSocialBindingType, OdooMapping[]>;
  connectionReadiness: OdooConnectionReadiness;
  canWrite: boolean;
  dataOrigin: OdooDataOrigin;
  fallbackReason?: string;
};

export type OdooMappingQuery = {
  organizationId?: string;
  bindingType?: OdooBindingType;
};
