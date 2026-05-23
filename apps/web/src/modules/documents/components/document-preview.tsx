"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDocumentAction,
  initialDocumentMutationState,
  updateDocumentStatusAction,
  type DocumentMutationState,
} from "@/modules/documents/services/document-actions";
import type { DocumentPreviewData } from "@/modules/documents/services/document-data";
import {
  generateSimplePdf,
} from "@/modules/documents/services/template-renderer";

type DocumentPreviewProps = {
  previewData: DocumentPreviewData;
  createAction?: (
    state: DocumentMutationState,
    formData: FormData,
  ) => Promise<DocumentMutationState>;
  updateStatusAction?: (
    state: DocumentMutationState,
    formData: FormData,
  ) => Promise<DocumentMutationState>;
};

export function DocumentPreview({
  previewData,
  createAction = createDocumentAction,
  updateStatusAction = updateDocumentStatusAction,
}: DocumentPreviewProps) {
  const { template, document, source, sourceMessage, variableSource, variables } = previewData;
  const [message, setMessage] = useState<string | null>(null);
  const [createState, createFormAction, isCreatePending] = useActionState(
    createAction,
    initialDocumentMutationState,
  );
  const [statusState, statusFormAction, isStatusPending] = useActionState(
    updateStatusAction,
    initialDocumentMutationState,
  );

  async function handleGeneratePdf() {
    const pdfBytes = await generateSimplePdf(template, document);
    const normalizedPdfBytes = new Uint8Array(pdfBytes);
    const blob = new Blob([normalizedPdfBytes.buffer], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);

    // On ouvre un nouvel onglet pour garder la phase 4 simple sans stockage serveur.
    window.open(url, "_blank", "noopener,noreferrer");
    setMessage("PDF simple genere dans un nouvel onglet.");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 4
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Base documentaire et templates
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Le document est genere depuis un template, avec variables dynamiques,
          entete, logo, tampon et signature simple.
        </p>
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            source === "supabase" ?
              "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-900"
          }`}
        >
          {sourceMessage}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Template
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {template.name}
          </h2>
          <div className="mt-5 space-y-3 text-sm text-stone-700">
            <p>Code template : {template.code}</p>
            <p>Entete : {template.letterheadName}</p>
            <p>Logo : {template.logoLabel}</p>
            <p>Tampon : {template.stampLabel}</p>
            <p>Signature : {template.signatureLabel}</p>
            <p>
              Variables d&apos;apercu :{" "}
              {variableSource === "supabase_metadata" ? "issues des metadonnees Supabase" : "issues de la demonstration"}
            </p>
          </div>

          <div className="mt-6">
            <Button onClick={handleGeneratePdf} className="h-11 rounded-full px-5 text-sm">
              Generer le PDF
            </Button>
          </div>

          <form action={statusFormAction} className="mt-6 space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
            <input type="hidden" name="documentId" value={document.id} />
            <input type="hidden" name="organizationId" value={document.organizationId ?? template.organizationId} />
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                name="nextStatus"
                value="validated"
                className="h-10 rounded-full px-4 text-sm"
                disabled={isStatusPending}
              >
                Valider le document
              </Button>
              <Button
                type="submit"
                name="nextStatus"
                value="archived"
                variant="outline"
                className="h-10 rounded-full px-4 text-sm"
                disabled={isStatusPending}
              >
                Archiver
              </Button>
            </div>
            {statusState.status !== "idle" ? (
              <p
                className={`rounded-2xl px-4 py-3 text-sm ${
                  statusState.status === "success" ?
                    "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
                }`}
              >
                {statusState.message}
              </p>
            ) : null}
          </form>

          {message ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}
        </article>

        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-stone-200 pb-5">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Apercu genere
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
              {document.subject}
            </h2>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-[linear-gradient(180deg,#fffdfa_0%,#f7f1e7_100%)] p-6">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <p className="text-lg font-semibold text-stone-950">
                  {template.letterheadName}
                </p>
                <p className="mt-2 text-sm text-stone-500">{document.subject}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                  Statut {document.status}
                  {document.projectId ? ` • projet ${document.projectId}` : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-600">
                {template.logoLabel}
              </div>
            </div>

            <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-7 text-stone-800">
              {document.bodyRendered}
            </pre>

            <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-5 text-sm">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                {template.stampLabel}
              </span>
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-700">
                {template.signatureLabel}
              </span>
            </div>
          </div>

          <form action={createFormAction} className="mt-6 space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
            <input type="hidden" name="templateId" value={template.id} />
            <input type="hidden" name="organizationId" value={template.organizationId} />
            <input type="hidden" name="projectId" value={document.projectId ?? ""} />
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Creer un nouveau document
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="recipientName" defaultValue={variables.recipient_name} placeholder="Destinataire" />
              <Input name="projectName" defaultValue={variables.project_name} placeholder="Nom du projet" />
              <Input name="meetingDate" defaultValue={variables.meeting_date} placeholder="Date de reunion" />
              <Input name="nextDeadline" defaultValue={variables.next_deadline} placeholder="Prochaine echeance" />
            </div>
            <Input name="progressSummary" defaultValue={variables.progress_summary} placeholder="Resume d'avancement" />
            <Input name="attentionPoint" defaultValue={variables.attention_point} placeholder="Point d'attention" />
            <Input name="senderName" defaultValue={variables.sender_name} placeholder="Nom expediteur" />
            <Button type="submit" className="h-11 rounded-full px-5 text-sm" disabled={isCreatePending}>
              Creer dans Supabase
            </Button>
            {createState.status !== "idle" ? (
              <p
                className={`rounded-2xl px-4 py-3 text-sm ${
                  createState.status === "success" ?
                    "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
                }`}
              >
                {createState.message}
              </p>
            ) : null}
          </form>
        </article>
      </div>
    </section>
  );
}
