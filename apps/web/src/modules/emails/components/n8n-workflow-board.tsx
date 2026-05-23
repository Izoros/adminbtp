import {
  createTaskFromInboundWebhook,
  createValidationWebhookPayload,
  validateInboundEmailWebhookPayload,
} from "@/modules/emails/services/n8n-workflows";
import type { DataOrigin } from "@/modules/emails/types/email";

const inboundExample = {
  organizationId: "org_adminbtp_001",
  projectId: "project_001",
  subject: "Relancer les pieces manquantes",
  bodyText: "Document manquant detecte sur la situation mensuelle.",
  sourceEmail: "client@adminbtp.yt",
  mailboxAddress: "client@adminbtp.yt",
  senderEmail: "conducteur@groupement-tce.fr",
  senderName: "Conducteur TCE",
  externalMessageId: "msg_demo_001",
  classification: "payment_followup" as const,
  persistEmail: true,
};

const outboundExample = createValidationWebhookPayload(
  "signature_request_001",
  "+262690000000",
  "Validation requise pour le compte rendu chantier.",
);

type N8nWorkflowBoardProps = {
  dataOrigin: DataOrigin;
  mailboxId: string | null;
  fallbackReason?: string;
};

export function N8nWorkflowBoard({
  dataOrigin,
  mailboxId,
  fallbackReason,
}: N8nWorkflowBoardProps) {
  const normalizedInbound = validateInboundEmailWebhookPayload(inboundExample);
  const createdTask = normalizedInbound.success
    ? createTaskFromInboundWebhook(normalizedInbound.data)
    : null;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 7
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Workflows n8n
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Le socle expose un webhook entrant pour creer une tache et un endpoint
          sortant pour preparer une demande de validation WhatsApp.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-600">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
            Resolution mailbox : {dataOrigin}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
            Mailbox id : {mailboxId ?? "non resolue"}
          </span>
          {fallbackReason ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
              {fallbackReason}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Webhook entrant
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
{JSON.stringify(
  normalizedInbound.success
    ? {
        payload: normalizedInbound.data,
        task: createdTask,
      }
    : normalizedInbound,
  null,
  2,
)}
          </pre>
        </article>

        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Validation sortante
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
{JSON.stringify(outboundExample, null, 2)}
          </pre>
        </article>
      </div>
    </section>
  );
}
