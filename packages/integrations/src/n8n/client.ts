/**
 * Contrat d'appel vers des workflows n8n. Chaque déclenchement doit porter une clé
 * d'idempotence (idempotencyKey) pour éviter les doubles relances/envois en cas de retry.
 * Les actions sensibles (envoi mail/WhatsApp réel) nécessitent toujours une validation
 * humaine préalable côté AdminBTP — n8n ne déclenche jamais d'action irréversible seul.
 */
export interface N8nTriggerPayload {
  workflow: "relance-decompte" | "document-expire" | "classification-mail" | "notification";
  idempotencyKey: string;
  organizationId: string;
  data: Record<string, unknown>;
}

export interface N8nTriggerResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

export interface IN8nClient {
  trigger(payload: N8nTriggerPayload): Promise<N8nTriggerResult>;
}

export class DemoN8nClient implements IN8nClient {
  async trigger(payload: N8nTriggerPayload): Promise<N8nTriggerResult> {
    console.warn(`[DEMO] Workflow n8n "${payload.workflow}" simulé (idempotencyKey=${payload.idempotencyKey}), aucune instance réelle appelée.`);
    return { success: true, executionId: `demo-exec-${Date.now()}` };
  }
}
