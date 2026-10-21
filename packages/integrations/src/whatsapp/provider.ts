/**
 * Interface WhatsApp Business — utilisée pour les validations rapides côté dirigeant.
 * Rappel produit : un accusé WhatsApp est une PREUVE D'APPROBATION, jamais une signature
 * électronique à valeur juridique complète (voir packages/types/src/validation.ts).
 */
export interface WhatsAppApprovalRequest {
  toPhoneNumber: string;
  documentTitle: string;
  documentPreviewUrl: string;
}

export interface IWhatsAppProvider {
  sendApprovalRequest(req: WhatsAppApprovalRequest): Promise<{ success: boolean; messageId?: string }>;
}

export class DemoWhatsAppProvider implements IWhatsAppProvider {
  async sendApprovalRequest(req: WhatsAppApprovalRequest) {
    console.warn(`[DEMO] Aucun message WhatsApp réel envoyé à ${req.toPhoneNumber} pour "${req.documentTitle}".`);
    return { success: true, messageId: `demo-wa-${Date.now()}` };
  }
}
