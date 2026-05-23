import {
  getAuditLogsForSuggestion,
  getSuggestionsByKind,
} from "@/modules/ai/services/ai-governance";
import type { AiGovernanceData } from "@/modules/ai/services/ai-data";

type AiGovernanceBoardProps = {
  data: AiGovernanceData;
  reviewSuggestionAction: (formData: FormData) => Promise<void>;
  applySuggestionAction: (formData: FormData) => Promise<void>;
};

export function AiGovernanceBoard({
  data,
  reviewSuggestionAction,
  applySuggestionAction,
}: AiGovernanceBoardProps) {
  const generatedSuggestions = data.suggestions.slice(0, 4);
  const emailSuggestions = getSuggestionsByKind(data.suggestions, "email_summary");
  const reviewableSuggestionId = data.suggestions[0]?.id ?? "";
  const reviewableLogs = getAuditLogsForSuggestion(
    data.auditLogs,
    reviewableSuggestionId,
  );
  const blockedSuggestions = data.suggestions.filter(
    (suggestion) => suggestion.governanceState === "blocked",
  );
  const warningSuggestions = data.suggestions.filter(
    (suggestion) => suggestion.governanceState === "warning",
  );
  const canWrite = data.source === "supabase" && Boolean(data.currentOrganizationId);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 11
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          IA metier sous validation humaine
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          L&apos;IA propose des resumes, classifications, courriers et aides metier,
          mais aucune action n&apos;est appliquee sans validation humaine explicite et
          sans tracabilite complete.
        </p>
        <p className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
          Source active : {data.source}
        </p>
        <p className="mt-3 text-sm text-stone-600">
          Organisation courante : {data.currentOrganizationId ?? "mode demo"}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Propositions IA
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              <p className="text-xs uppercase text-stone-500">Suggestions</p>
              <p className="mt-2 text-2xl font-semibold text-stone-950">{data.suggestions.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="text-xs uppercase text-amber-700">A revoir</p>
              <p className="mt-2 text-2xl font-semibold">{warningSuggestions.length}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <p className="text-xs uppercase text-rose-700">Bloquees</p>
              <p className="mt-2 text-2xl font-semibold">{blockedSuggestions.length}</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {generatedSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-700"
              >
                <p className="font-medium text-stone-950">{suggestion.title}</p>
                <p className="mt-2">Type : {suggestion.kind}</p>
                <p>Statut : {suggestion.status}</p>
                <p>
                  Gouvernance : {suggestion.governanceState ?? "healthy"} · audit :{" "}
                  {suggestion.auditTrailCount ?? 0}
                </p>
                <p className="mt-2">{suggestion.summary}</p>
                {suggestion.governanceIssues?.length ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                    {suggestion.governanceIssues.map((issue) => (
                      <p key={issue.code}>
                        {issue.severity} : {issue.message}
                      </p>
                    ))}
                  </div>
                ) : null}
                {canWrite && suggestion.status === "pending_human_validation" ? (
                  <form action={reviewSuggestionAction} className="mt-3 flex flex-wrap gap-3">
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <button
                      type="submit"
                      name="decision"
                      value="approved"
                      className="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-800"
                    >
                      Approuver
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="rejected"
                      className="rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-500"
                    >
                      Rejeter
                    </button>
                  </form>
                ) : null}
                {canWrite &&
                suggestion.status === "approved" &&
                suggestion.governanceState !== "blocked" ? (
                  <form action={applySuggestionAction} className="mt-3">
                    <input type="hidden" name="suggestionId" value={suggestion.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-600"
                    >
                      Appliquer la suggestion
                    </button>
                  </form>
                ) : null}
                {suggestion.status === "applied" ? (
                  <p className="mt-3 text-xs font-medium text-emerald-700">
                    Suggestion appliquee avec validation humaine et audit associe.
                  </p>
                ) : null}
              </div>
            ))}
            {generatedSuggestions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                Aucune suggestion IA reelle n&apos;est disponible pour cette organisation.
              </div>
            ) : null}
          </div>
        </article>

        <article className="space-y-5">
          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Suggestions tracees
            </p>
            <div className="mt-4 space-y-3">
              {emailSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
                >
                  <p className="font-medium text-stone-950">{suggestion.title}</p>
                  <p className="mt-1">Source : {suggestion.sourceEntityType}</p>
                  <p>Resume : {suggestion.summary}</p>
                  <p>Statut : {suggestion.status}</p>
                </div>
              ))}
              {emailSuggestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                  Aucune suggestion de resume mail n&apos;est visible sur le scope courant.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Audit et validation
            </p>
            <div className="mt-4 space-y-3">
              {reviewableLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
                >
                  <p className="font-medium text-stone-950">{log.action}</p>
                  <p className="mt-1">Acteur : {log.actorType}</p>
                  <p>{log.details}</p>
                </div>
              ))}
              {reviewableLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                  Aucun log d&apos;audit disponible pour la suggestion selectionnee.
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
