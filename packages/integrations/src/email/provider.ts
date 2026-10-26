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

/**
 * Fournisseur réel via l'API Resend — clé lue dans RESEND_API_KEY, jamais en dur. Resend est un
 * service d'envoi transactionnel sortant uniquement : listInbox() n'a pas d'équivalent côté
 * Resend (il faudrait Gmail API/Microsoft Graph pour lire une boîte réelle, non branché ici) et
 * échoue explicitement plutôt que de retomber silencieusement sur une liste vide.
 */
const RESEND_BASE_URL = "https://api.resend.com";

export class ResendEmailProvider implements IEmailProvider {
  async send(email: OutboundEmail): Promise<{ success: boolean; providerMessageId?: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY absente — fournisseur email Resend non configuré.");
    }
    const res = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.htmlBody,
        attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.contentBase64 })),
      }),
    });
    if (!res.ok) {
      throw new Error(`Envoi Resend en échec (${res.status}) : ${await res.text()}`);
    }
    const data = (await res.json()) as { id: string };
    return { success: true, providerMessageId: data.id };
  }

  async listInbox(): Promise<InboundEmail[]> {
    throw new Error(
      "ResendEmailProvider.listInbox non supporté — Resend est un service d'envoi sortant uniquement, aucune lecture de boîte réelle branchée."
    );
  }
}

/** ResendEmailProvider si RESEND_API_KEY est définie, DemoEmailProvider sinon — jamais d'I/O réseau sans clé. */
export function getEmailProvider(): IEmailProvider {
  return process.env.RESEND_API_KEY ? new ResendEmailProvider() : new DemoEmailProvider();
}
