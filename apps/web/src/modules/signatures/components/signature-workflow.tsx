"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canTransitionSignatureRequest,
  prepareWhatsappValidationMessage,
} from "@/modules/signatures/services/signature-flow";
import {
  createSignatureRequestAction,
  initialSignatureMutationState,
  transitionSignatureRequestAction,
  type SignatureMutationState,
} from "@/modules/signatures/services/signature-actions";
import type { SignatureWorkflowData } from "@/modules/signatures/services/signature-data";

type SignatureWorkflowProps = {
  workflowData: SignatureWorkflowData;
  createAction?: (
    state: SignatureMutationState,
    formData: FormData,
  ) => Promise<SignatureMutationState>;
  transitionAction?: (
    state: SignatureMutationState,
    formData: FormData,
  ) => Promise<SignatureMutationState>;
};

export function SignatureWorkflow({
  workflowData,
  createAction = createSignatureRequestAction,
  transitionAction = transitionSignatureRequestAction,
}: SignatureWorkflowProps) {
  const { auditEntries, profile, request, source, sourceMessage } = workflowData;
  const whatsappDraft = prepareWhatsappValidationMessage(request);
  const [createState, createFormAction, isCreatePending] = useActionState(
    createAction,
    initialSignatureMutationState,
  );
  const [transitionState, transitionFormAction, isTransitionPending] = useActionState(
    transitionAction,
    initialSignatureMutationState,
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 5
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Circuit de validation et signature
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Chaque demande suit un circuit interne, prepare la signature et laisse
          une trace dans le journal d&apos;audit.
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Demande
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Validation de document chantier
          </h2>

          <div className="mt-5 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
            <p>Profil de signature : {profile.label}</p>
            <p>Signataire : {profile.signerName}</p>
            <p>Role : {profile.signerRole}</p>
            <p>Signature WhatsApp : {profile.whatsappEnabled ? "activee" : "desactivee"}</p>
            <p>Document lie : {request.documentTitle ?? request.documentId}</p>
            <p>Statut document : {request.documentStatus ?? "non remonte"}</p>
            <p>Statut courant : {request.status}</p>
            <p>Notes : {request.validationNotes}</p>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-amber-200/70 bg-[linear-gradient(135deg,#fffaf4_0%,#f8efe0_100%)] p-5 text-sm text-stone-700">
            <p>
              Transition vers <strong>`pending_signature`</strong> :
              {" "}
              {canTransitionSignatureRequest(request.status, "pending_signature")
                ? "autorisee"
                : "bloquee"}
            </p>
            <p className="mt-3">
              Transition vers <strong>`approved`</strong> :
              {" "}
              {canTransitionSignatureRequest(request.status, "approved")
                ? "autorisee"
                : "bloquee tant que la validation interne n'est pas terminee"}
            </p>
          </div>

          <form action={transitionFormAction} className="mt-5 space-y-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="organizationId" value={request.organizationId} />
            <input type="hidden" name="currentStatus" value={request.status} />
            <input type="hidden" name="actorUserId" value={request.requestedBy} />
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                name="nextStatus"
                value="pending_signature"
                className="h-10 rounded-full px-4 text-sm"
                disabled={isTransitionPending}
              >
                Lancer la signature
              </Button>
              <Button
                type="submit"
                name="nextStatus"
                value="approved"
                variant="outline"
                className="h-10 rounded-full px-4 text-sm"
                disabled={isTransitionPending}
              >
                Approuver
              </Button>
              <Button
                type="submit"
                name="nextStatus"
                value="rejected"
                variant="destructive"
                className="h-10 rounded-full px-4 text-sm"
                disabled={isTransitionPending}
              >
                Rejeter
              </Button>
            </div>
            {transitionState.status !== "idle" ? (
              <p
                className={`rounded-2xl px-4 py-3 text-sm ${
                  transitionState.status === "success" ?
                    "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
                }`}
              >
                {transitionState.message}
              </p>
            ) : null}
          </form>
        </article>

        <article className="space-y-6">
          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Audit log
            </p>
            <div className="mt-4 space-y-3">
              {auditEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                >
                  <p className="font-medium text-stone-950">{entry.label}</p>
                  <p className="mt-2">Action : {entry.actionType}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Cree le : {entry.createdAt ?? "horodatage non remonte"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Preparation WhatsApp
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
{JSON.stringify(whatsappDraft, null, 2)}
            </pre>
          </div>

          <form action={createFormAction} className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Nouvelle demande
            </p>
            <div className="mt-4 space-y-3">
              <input type="hidden" name="documentId" value={request.documentId} />
              <input type="hidden" name="organizationId" value={request.organizationId} />
              <input type="hidden" name="signatureProfileId" value={profile.id} />
              <input type="hidden" name="requestedBy" value={request.requestedBy} />
              <Input
                name="validationNotes"
                defaultValue={request.validationNotes}
                placeholder="Notes de validation"
              />
              <Button type="submit" className="h-10 rounded-full px-4 text-sm" disabled={isCreatePending}>
                Creer une nouvelle demande
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
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}
