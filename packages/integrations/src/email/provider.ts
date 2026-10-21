/**
 * Interface fournisseur email — permet de brancher Gmail API ou Microsoft Graph
 * sans verrouiller le cœur métier. Aucun envoi réel tant que le mode n'est pas "live"
 * et que le domaine client n'est pas vérifié.
 */
export interface OutboundEmail {
  to: string[];
  from: string;
  subject: string;
  htmlBody: string;
  attachments?: { filename: string; contentBase64: string }[];
}

export interface InboundEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  textBody: string;
}

export interface IEmailProvider {
  send(email: OutboundEmail): Promise<{ success: boolean; providerMessageId?: string }>;
  listInbox(mailAddress: string, limit?: number): Promise<InboundEmail[]>;
}

export class DemoEmailProvider implements IEmailProvider {
  async send(email: OutboundEmail) {
    console.warn(`[DEMO] Aucun envoi réel. Email simulé vers ${email.to.join(", ")} — sujet: "${email.subject}"`);
    return { success: true, providerMessageId: `demo-${Date.now()}` };
  }

  async listInbox(mailAddress: string): Promise<InboundEmail[]> {
    console.warn(`[DEMO] listInbox(${mailAddress}) — boîte simulée, aucune connexion Gmail/Graph réelle.`);
    return [];
  }
}
