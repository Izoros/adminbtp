/**
 * Adaptateur Odoo — le cœur métier AdminBTP ne doit JAMAIS dépendre directement d'Odoo.
 * Toute lecture/écriture passe par cette interface, implémentée soit par un adaptateur
 * réel (API JSON-2 pour Odoo 19+, à privilégier sur l'ancien RPC), soit par la version
 * de démonstration ci-dessous.
 *
 * Répartition des responsabilités (à affiner avec le besoin réel une fois Odoo connecté) :
 * - Maîtrisé par Odoo   : CRM, facturation, abonnements, comptabilité, paie.
 * - Maîtrisé par AdminBTP : chantiers, phases, documents, mails, validations, expertise.
 * - Synchronisé (lecture/écriture contrôlée) : fiches contacts/sociétés clientes, prestations facturables.
 *
 * Aucune donnée n'est dupliquée en écriture concurrente sur les deux systèmes pour un même champ :
 * chaque champ a un système "maître" unique.
 */

export interface OdooContact {
  odooPartnerId: number;
  name: string;
  email?: string;
  siret?: string;
}

export interface OdooInvoiceSummary {
  odooInvoiceId: number;
  partnerId: number;
  amountTotal: number;
  state: "draft" | "posted" | "paid" | "cancel";
  invoiceDate?: string;
}

export interface OdooSyncResult {
  success: boolean;
  syncedAt: string;
  errors: string[];
}

export interface IOdooAdapter {
  /** Vérifie la connexion et retourne la version/API détectées. */
  ping(): Promise<{ connected: boolean; odooVersion?: string; apiMode?: "json2" | "rpc" }>;
  getContactByOrganizationId(organizationId: string): Promise<OdooContact | null>;
  upsertContact(contact: OdooContact): Promise<OdooContact>;
  listInvoicesForPartner(odooPartnerId: number): Promise<OdooInvoiceSummary[]>;
}

/**
 * Implémentation de démonstration — AUCUN appel réseau. Utilisée tant qu'Odoo n'est
 * pas connecté. Toujours journaliser clairement le mode démo pour ne jamais le confondre
 * avec une intégration réelle.
 */
export class DemoOdooAdapter implements IOdooAdapter {
  async ping() {
    return { connected: false as const, odooVersion: undefined, apiMode: undefined };
  }

  async getContactByOrganizationId(organizationId: string): Promise<OdooContact | null> {
    console.warn(`[DEMO] DemoOdooAdapter.getContactByOrganizationId(${organizationId}) — aucune connexion Odoo réelle.`);
    return null;
  }

  async upsertContact(contact: OdooContact): Promise<OdooContact> {
    console.warn(`[DEMO] DemoOdooAdapter.upsertContact — simulation, rien n'est envoyé à Odoo.`, contact);
    return contact;
  }

  async listInvoicesForPartner(): Promise<OdooInvoiceSummary[]> {
    return [];
  }
}
