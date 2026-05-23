"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { reclassifyEmail } from "@/modules/emails/services/email-classification";
import type {
  EmailClassification,
  EmailRecord,
  MailboxBoardData,
} from "@/modules/emails/types/email";

const classifications: EmailClassification[] = [
  "unclassified",
  "document",
  "payment_followup",
  "task",
  "client_message",
  "validation",
];

type MailboxBoardProps = {
  initialData: MailboxBoardData;
};

export function MailboxBoard({ initialData }: MailboxBoardProps) {
  const [emails, setEmails] = useState<EmailRecord[]>(initialData.emails);

  const mailbox = initialData.mailbox;

  const providerPreparation = useMemo(
    () => [
      "Gmail API : connection OAuth a preparer sur la boite client.",
      "Outlook API : consentement Microsoft 365 a integrer plus tard.",
      "Classification manuelle active avant toute automatisation IA.",
    ],
    [],
  );

  function handleClassificationChange(emailId: string, classification: EmailClassification) {
    setEmails((currentEmails) =>
      currentEmails.map((email) =>
        email.id === emailId ? reclassifyEmail(email, classification) : email,
      ),
    );
  }

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
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            {mailbox.displayName}
          </h2>
          <div className="mt-5 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
            <p>Adresse : {mailbox.address}</p>
            <p>Provider courant : {mailbox.provider}</p>
            <p>Organisation : {mailbox.organizationId}</p>
          </div>

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
        </article>

        <article className="space-y-5">
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

              <div className="mt-5 flex flex-wrap gap-2">
                {classifications.map((classification) => (
                  <Button
                    key={classification}
                    variant={email.classification === classification ? "default" : "outline"}
                    className="h-9 rounded-full px-4 text-xs"
                    onClick={() => handleClassificationChange(email.id, classification)}
                  >
                    {classification}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
