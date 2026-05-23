"use client";

import { useActionState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  emailClassifications,
  initialEmailMutationState,
  type EmailMutationState,
} from "@/modules/emails/services/email-action-state";
import {
  initialMailboxMutationState,
  type MailboxMutationState,
} from "@/modules/emails/services/mailbox-action-state";
import type {
  EmailRecord,
  MailboxBoardData,
} from "@/modules/emails/types/email";

type MailboxBoardProps = {
  initialData: MailboxBoardData;
  updateAction: (
    state: EmailMutationState,
    formData: FormData,
  ) => Promise<EmailMutationState>;
  createMailboxAction: (
    state: MailboxMutationState,
    formData: FormData,
  ) => Promise<MailboxMutationState>;
};

export function MailboxBoard({
  initialData,
  updateAction,
  createMailboxAction,
}: MailboxBoardProps) {
  const [mutationState, mutationAction, isMutationPending] = useActionState(
    updateAction,
    initialEmailMutationState,
  );
  const [mailboxMutationState, mailboxMutationAction, isMailboxMutationPending] =
    useActionState(createMailboxAction, initialMailboxMutationState);

  const mailbox = initialData.mailbox;
  const emails: EmailRecord[] = initialData.emails;

  const providerPreparation = useMemo(
    () => [
      "Gmail API : connection OAuth a preparer sur la boite client.",
      "Outlook API : consentement Microsoft 365 a integrer plus tard.",
      "Classification manuelle active avant toute automatisation IA.",
    ],
    [],
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 6
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Mails et boites generiques
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Les emails peuvent etre classes manuellement et rattaches a une
          organisation, un chantier et une tache avant l&apos;arrivee des connecteurs.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-600">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
            Source : {initialData.dataOrigin}
          </span>
          {initialData.fallbackReason ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
              {initialData.fallbackReason}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Boite generique
          </p>
          {mailbox ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                {mailbox.displayName}
              </h2>
              <div className="mt-5 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
                <p>Adresse : {mailbox.address}</p>
                <p>Provider courant : {mailbox.provider}</p>
                <p>Organisation : {mailbox.organizationId}</p>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
              Aucune boite generique n&apos;est encore active pour cette organisation.
            </div>
          )}

          <div className="mt-6 rounded-[1.5rem] border border-amber-200/70 bg-[linear-gradient(135deg,#fffaf4_0%,#f8efe0_100%)] p-5">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Preparation API
            </p>
            <ul className="mt-4 space-y-3 text-sm text-stone-700">
              {providerPreparation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {!mailbox ? (
            <form
              action={mailboxMutationAction}
              className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4"
            >
              <input type="hidden" name="organizationId" value={initialData.organizationId} />
              <div className="grid gap-3">
                <label className="space-y-2 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                  Libelle
                  <Input
                    name="displayName"
                    defaultValue="Boite client AdminBTP"
                    disabled={isMailboxMutationPending}
                  />
                </label>
                <label className="space-y-2 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                  Adresse
                  <Input
                    name="address"
                    defaultValue="client@adminbtp.yt"
                    disabled={isMailboxMutationPending}
                  />
                </label>
                <label className="space-y-2 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                  Provider
                  <select
                    name="provider"
                    defaultValue="internal"
                    className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm font-normal tracking-normal text-stone-700 outline-none transition focus:border-stone-400"
                    disabled={isMailboxMutationPending}
                  >
                    <option value="internal">internal</option>
                    <option value="gmail">gmail</option>
                    <option value="outlook">outlook</option>
                  </select>
                </label>
                <div>
                  <Button
                    type="submit"
                    className="h-11 rounded-full px-5 text-sm"
                    disabled={isMailboxMutationPending}
                  >
                    Creer la boite generique
                  </Button>
                </div>
              </div>
              {mailboxMutationState.status !== "idle" ? (
                <p
                  className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                    mailboxMutationState.status === "success"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800"
                  }`}
                >
                  {mailboxMutationState.message}
                </p>
              ) : null}
            </form>
          ) : null}
        </article>

        <article className="space-y-5">
          {emails.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              Aucun email n&apos;est encore visible pour la boite courante.
            </div>
          ) : null}
          {emails.map((email) => (
            <div
              key={email.id}
              className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-950">{email.subject}</p>
                  <p className="mt-2 text-sm text-stone-600">
                    {email.senderName ?? "Expediteur inconnu"} · {email.senderEmail}
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                  {email.classification}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-stone-700">{email.bodyText}</p>
              {email.receivedAt ? (
                <p className="mt-3 text-xs text-stone-500">
                  Recu le : {new Date(email.receivedAt).toLocaleString("fr-FR")}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 text-sm text-stone-700 sm:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  Organisation : {email.organizationId}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  Chantier : {email.projectId ?? "non rattache"}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  Tache : {email.relatedTaskId ?? "non rattachee"}
                </div>
              </div>

              <form
                action={mutationAction}
                className="mt-5 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4"
              >
                <input type="hidden" name="emailId" value={email.id} />
                <input type="hidden" name="organizationId" value={email.organizationId} />
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                  <label className="space-y-2 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                    Classification
                    <select
                      name="classification"
                      defaultValue={email.classification}
                      className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm font-normal tracking-normal text-stone-700 outline-none transition focus:border-stone-400"
                      disabled={isMutationPending}
                    >
                      {emailClassifications.map((classification) => (
                        <option key={classification} value={classification}>
                          {classification}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                    Chantier
                    <Input
                      name="projectId"
                      defaultValue={email.projectId ?? ""}
                      placeholder="project_001"
                      disabled={isMutationPending}
                    />
                  </label>
                  <label className="space-y-2 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                    Tache
                    <Input
                      name="relatedTaskId"
                      defaultValue={email.relatedTaskId ?? ""}
                      placeholder="task_001"
                      disabled={isMutationPending}
                    />
                  </label>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      className="h-11 rounded-full px-5 text-sm"
                      disabled={isMutationPending}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
                {mutationState.status !== "idle" && mutationState.emailId === email.id ? (
                  <p
                    className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                      mutationState.status === "success" ?
                        "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800"
                    }`}
                  >
                    {mutationState.message}
                  </p>
                ) : null}
              </form>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
