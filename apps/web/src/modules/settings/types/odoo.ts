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
