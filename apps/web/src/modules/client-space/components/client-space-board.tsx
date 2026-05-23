import {
  getCommentsForWorkspaceItem,
} from "@/modules/client-space/services/client-space-access";
import type { ClientSpaceData } from "@/modules/client-space/services/client-space-data";

type ClientSpaceBoardProps = {
  data: ClientSpaceData;
  addCommentAction: (formData: FormData) => Promise<void>;
  submitWorkspaceDecisionAction: (formData: FormData) => Promise<void>;
};

export function ClientSpaceBoard({
  data,
  addCommentAction,
  submitWorkspaceDecisionAction,
}: ClientSpaceBoardProps) {
  const visibleItems = data.workspaceItems;
  const reviewedItem =
    visibleItems.find((item) => item.type === "validation") ?? visibleItems[0] ?? null;
  const validationComments = getCommentsForWorkspaceItem(
    data.comments,
    reviewedItem?.id ?? "",
  );
  const canWrite = data.source === "supabase" && Boolean(reviewedItem);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 12
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Espace client simplifie
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Le client ne consulte que ses propres donnees et peut valider, refuser
          ou commenter les elements exposes par AdminBTP.
        </p>
        <p className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
          Source active : {data.source}
        </p>
        <p className="mt-3 text-sm text-stone-600">
          Mode viewer : {data.viewerMode} · organisation cliente :{" "}
          {data.clientOrganizationId ?? "non definie"}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Elements visibles
          </p>
          <div className="mt-4 space-y-4">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-700"
              >
                <p className="font-medium text-stone-950">{item.title}</p>
                <p className="mt-2">Type : {item.type}</p>
                <p>Projet : {item.projectId ?? "non renseigne"}</p>
                <p>Scope : {item.accessScope ?? "non renseigne"}</p>
                <p>Statut : {item.status}</p>
                <p className="mt-2">{item.summary}</p>
              </div>
            ))}
            {visibleItems.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                Aucun element client reel n&apos;est visible dans le scope courant.
              </div>
            ) : null}
          </div>
        </article>

        <article className="space-y-5">
          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Action client
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
              <p>Element : {reviewedItem?.title}</p>
              <p>Type : {reviewedItem?.type ?? "non defini"}</p>
              <p>Statut courant : {reviewedItem?.status ?? "non defini"}</p>
            </div>
            <form action={submitWorkspaceDecisionAction} className="mt-4 space-y-3">
              <input type="hidden" name="workspaceItemId" value={reviewedItem?.id ?? ""} />
              <textarea
                name="message"
                rows={3}
                placeholder="Ajouter un motif ou une precision pour la validation client."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400"
                disabled={!canWrite}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  name="decision"
                  value="approved"
                  disabled={!canWrite}
                  className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  Valider
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="commented"
                  disabled={!canWrite}
                  className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
                >
                  Demander des ajustements
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="rejected"
                  disabled={!canWrite}
                  className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 transition hover:border-red-300 disabled:cursor-not-allowed disabled:border-red-100 disabled:text-red-300"
                >
                  Refuser
                </button>
              </div>
            </form>
            <form action={addCommentAction} className="mt-4 space-y-3">
              <input type="hidden" name="workspaceItemId" value={reviewedItem?.id ?? ""} />
              <textarea
                name="message"
                rows={4}
                placeholder="Ajouter un retour client ou un commentaire de suivi."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400"
                disabled={!canWrite}
              />
              <button
                type="submit"
                disabled={!canWrite}
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                Ajouter un commentaire
              </button>
              {!canWrite ? (
                <p className="text-sm text-stone-500">
                  L&apos;ecriture n&apos;est active qu&apos;en mode Supabase sur un element visible.
                </p>
              ) : (
                <p className="text-sm text-stone-500">
                  Les validations client sont maintenant ecrites dans Supabase et relues dans le statut visible.
                </p>
              )}
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Commentaires
            </p>
            <div className="mt-4 space-y-3">
              {validationComments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
                >
                  <p className="font-medium text-stone-950">{comment.authorRole}</p>
                  {comment.decision ? (
                    <p className="mt-1 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
                      Decision : {comment.decision}
                    </p>
                  ) : null}
                  <p className="mt-1">{comment.message}</p>
                </div>
              ))}
              {validationComments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                  Aucun commentaire client disponible sur l&apos;element en cours.
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
