import type {
  OdooBindingType,
  OdooSocialBindingType,
} from "@/modules/settings/types/odoo";

export type OdooBindingDefinition = {
  bindingType: OdooBindingType;
  title: string;
  description: string;
  entityLabel: string;
  entityPlaceholder: string;
  odooModel: string;
  recordLabel: string;
  recordPlaceholder: string;
  sensitivity: "standard" | "social" | "payroll";
};

export const odooCommercialBindingDefinitions: OdooBindingDefinition[] = [
  {
    bindingType: "invoice",
    title: "Factures",
    description: "Liaison des situations et factures AdminBTP avec la comptabilite Odoo.",
    entityLabel: "Entite AdminBTP facture",
    entityPlaceholder: "invoice_adminbtp_001",
    odooModel: "account.move",
    recordLabel: "Identifiant facture Odoo",
    recordPlaceholder: "8891",
    sensitivity: "standard",
  },
  {
    bindingType: "subscription",
    title: "Abonnements",
    description: "Liaison des abonnements AdminBTP avec le modele installe dans Odoo.",
    entityLabel: "Entite AdminBTP abonnement",
    entityPlaceholder: "subscription_adminbtp_001",
    odooModel: "sale.subscription",
    recordLabel: "Identifiant abonnement Odoo",
    recordPlaceholder: "2001",
    sensitivity: "standard",
  },
  {
    bindingType: "consulting_service",
    title: "Prestations de conseil",
    description: "Liaison des prestations techniques avec le catalogue de services Odoo.",
    entityLabel: "Entite AdminBTP conseil",
    entityPlaceholder: "consulting_adminbtp_001",
    odooModel: "product.product",
    recordLabel: "Identifiant prestation Odoo",
    recordPlaceholder: "301",
    sensitivity: "standard",
  },
];

export const odooSocialBindingDefinitions: Array<
  OdooBindingDefinition & { bindingType: OdooSocialBindingType }
> = [
  {
    bindingType: "employee",
    title: "Collaborateurs",
    description: "Identite professionnelle et rattachement du collaborateur.",
    entityLabel: "Collaborateur AdminBTP",
    entityPlaceholder: "employee_adminbtp_001",
    odooModel: "hr.employee",
    recordLabel: "Identifiant collaborateur Odoo",
    recordPlaceholder: "410",
    sensitivity: "social",
  },
  {
    bindingType: "employment_contract",
    title: "Contrats de travail",
    description: "Contrats, calendrier de travail et structure salariale associee.",
    entityLabel: "Contrat AdminBTP",
    entityPlaceholder: "contract_adminbtp_001",
    odooModel: "hr.contract",
    recordLabel: "Identifiant contrat Odoo",
    recordPlaceholder: "720",
    sensitivity: "social",
  },
  {
    bindingType: "attendance",
    title: "Presences",
    description: "Pointages et presences destines au suivi du temps de travail.",
    entityLabel: "Presence AdminBTP",
    entityPlaceholder: "attendance_adminbtp_001",
    odooModel: "hr.attendance",
    recordLabel: "Identifiant presence Odoo",
    recordPlaceholder: "845",
    sensitivity: "social",
  },
  {
    bindingType: "time_off",
    title: "Conges et absences",
    description: "Demandes de conges et absences avec leur circuit de validation.",
    entityLabel: "Absence AdminBTP",
    entityPlaceholder: "leave_adminbtp_001",
    odooModel: "hr.leave",
    recordLabel: "Identifiant absence Odoo",
    recordPlaceholder: "930",
    sensitivity: "social",
  },
  {
    bindingType: "timesheet",
    title: "Feuilles de temps",
    description: "Temps imputes par collaborateur, chantier ou mission de conseil.",
    entityLabel: "Temps AdminBTP",
    entityPlaceholder: "timesheet_adminbtp_001",
    odooModel: "account.analytic.line",
    recordLabel: "Identifiant ligne de temps Odoo",
    recordPlaceholder: "1080",
    sensitivity: "social",
  },
  {
    bindingType: "payslip",
    title: "Bulletins de paie",
    description: "Liaison avec les bulletins Odoo, sans recopier leur contenu sensible.",
    entityLabel: "Bulletin AdminBTP",
    entityPlaceholder: "payslip_adminbtp_001",
    odooModel: "hr.payslip",
    recordLabel: "Identifiant bulletin Odoo",
    recordPlaceholder: "1210",
    sensitivity: "payroll",
  },
];

export const supportedOdooBindingTypes = [
  "customer",
  ...odooCommercialBindingDefinitions.map((definition) => definition.bindingType),
  ...odooSocialBindingDefinitions.map((definition) => definition.bindingType),
] as OdooBindingType[];

export function isOdooBindingType(value: string | null): value is OdooBindingType {
  return Boolean(value && supportedOdooBindingTypes.includes(value as OdooBindingType));
}
