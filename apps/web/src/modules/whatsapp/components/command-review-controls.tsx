"use client";

import { useActionState } from "react";

import {
  reviewWhatsAppCommandAction,
  type WhatsAppCommandReviewState,
} from "@/modules/whatsapp/services/command-review-actions";

const initialState: WhatsAppCommandReviewState = {
  status: "idle",
  message: "",
};

export function CommandReviewControls({ commandId }: { commandId: string }) {
  const [state, formAction, pending] = useActionState(
    reviewWhatsAppCommandAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-2 border-t border-stone-100 pt-4">
      <input type="hidden" name="commandId" value={commandId} />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Revue…" : "Approuver la demande"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
        >
          Refuser
        </button>
      </div>
      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-xs text-rose-700"
              : "text-xs text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
