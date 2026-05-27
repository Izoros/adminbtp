export type OdooBindingType =
  | "customer"
  | "invoice"
  | "subscription"
  | "consulting_service";

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
  dataOrigin: OdooDataOrigin;
  fallbackReason?: string;
};

export type OdooMappingQuery = {
  organizationId?: string;
  bindingType?: OdooBindingType;
};
