import {
  expertRequestTypeOptions,
  type ConsultingDashboardData,
} from "@/modules/consulting/services/consulting-data";

type ConsultingDashboardProps = {
  data: ConsultingDashboardData;
  createExpertRequestAction: (formData: FormData) => Promise<void>;
  createConsultingMissionAction: (formData: FormData) => Promise<void>;
  registerConsultingHourAction: (formData: FormData) => Promise<void>;
};

export function ConsultingDashboard({
  data,
  createExpertRequestAction,
  createConsultingMissionAction,
  registerConsultingHourAction,
}: ConsultingDashboardProps) {
  const expert = data.request
    ? data.expertProfiles.find(
        (profile) => profile.id === data.request?.assignedExpertId,
      )
    : null;
  const canWrite = data.source === "supabase" && Boolean(data.currentOrganizationId);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phase 10
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Expertise ingenieur / architecte HMONP
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          Le client peut ouvrir une demande d&apos;avis expert reliee a un chantier ou
          un document, transformer cette demande en mission et suivre les heures
          ainsi que l&apos;avis technique produit.
        </p>
        <p className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
          Source active : {data.source}
        </p>
        <p className="mt-3 text-sm text-stone-600">
          Organisation courante : {data.currentOrganizationId ?? "mode demo"}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
            Demande expert
          </p>
          {data.request ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                {data.request.title}
              </h2>
              <div className="mt-5 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 text-sm text-stone-700">
                <p>Numero : {data.request.requestNumber}</p>
                <p>Chantier : {data.request.relatedEntityId}</p>
                <p>Statut : {data.request.status}</p>
                <p>Expert : {expert?.fullName ?? "Non assigne"}</p>
                <p>Profil : {expert?.headline ?? "A preciser"}</p>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
              Aucune demande d&apos;expertise n&apos;est encore visible sur l&apos;organisation courante.
            </div>
          )}
        </article>

        <article className="space-y-5">
          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Ouvrir une demande
            </p>
            <form action={createExpertRequestAction} className="mt-4 space-y-4">
              <input type="hidden" name="relatedEntityType" value="project" />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Titre</span>
                  <input
                    name="title"
                    placeholder="Exemple : Analyse DOE lot facade"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Type</span>
                  <select
                    name="requestType"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                    defaultValue="document_analysis"
                    disabled={!canWrite}
                  >
                    {expertRequestTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="space-y-2 text-sm text-stone-700">
                <span>Reference chantier ou document</span>
                <input
                  name="relatedEntityId"
                  placeholder={data.request?.relatedEntityId ?? "project_001"}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  disabled={!canWrite}
                />
              </label>
              <label className="space-y-2 text-sm text-stone-700">
                <span>Contexte</span>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Preciser les pieces a analyser, l'urgence et l'avis attendu."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  disabled={!canWrite}
                />
              </label>
              <button
                type="submit"
                disabled={!canWrite}
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                Creer la demande expert
              </button>
              {!canWrite ? (
                <p className="text-sm text-stone-500">
                  La creation est reservee au mode Supabase avec organisation courante resolue.
                </p>
              ) : null}
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Mission de conseil
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
              <p>Mission : {data.mission?.title ?? "Aucune mission ouverte"}</p>
              <p>Numero : {data.mission?.missionNumber ?? "A definir"}</p>
              <p>Heures vendues : {data.mission?.soldHours ?? 0}</p>
              <p>Heures consommees : {data.mission?.consumedHours ?? 0}</p>
            </div>

            {!data.mission && data.request ? (
              <form action={createConsultingMissionAction} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Titre mission</span>
                    <input
                      name="title"
                      defaultValue={data.request.title}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Heures vendues</span>
                    <input
                      name="soldHours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      defaultValue="4"
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Expert pilote</span>
                  <select
                    name="leadExpertId"
                    defaultValue={data.request.assignedExpertId || ""}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  >
                    <option value="">A affecter plus tard</option>
                    {data.expertProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Description</span>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue="Mission issue d'une demande d'expertise AdminBTP."
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canWrite}
                  className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  Transformer en mission
                </button>
              </form>
            ) : null}

            <div className="mt-4 space-y-3">
              {data.missionHours.map((hour) => (
                <div
                  key={hour.id}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                >
                  <p>{hour.workDate}</p>
                  <p className="mt-1">
                    Temps passe : {hour.hoursSpent} h · facturable : {hour.billableHours} h
                  </p>
                </div>
              ))}
            </div>

            {data.mission ? (
              <form action={registerConsultingHourAction} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Date</span>
                    <input
                      name="workDate"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Temps passe (h)</span>
                    <input
                      name="hoursSpent"
                      type="number"
                      min="0.25"
                      step="0.25"
                      defaultValue="1"
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Temps facturable (h)</span>
                    <input
                      name="billableHours"
                      type="number"
                      min="0"
                      step="0.25"
                      defaultValue="1"
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Expert</span>
                    <select
                      name="expertProfileId"
                      defaultValue={expert?.id ?? data.expertProfiles[0]?.id ?? ""}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    >
                      <option value="">Aucun expert rattache</option>
                      {data.expertProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-stone-700">
                    <span>Activite</span>
                    <input
                      name="activityType"
                      placeholder="analyse_documentaire"
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                      disabled={!canWrite}
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Notes</span>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Preciser le travail realise, les points bloquants et la suite proposee."
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-400"
                    disabled={!canWrite}
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canWrite}
                  className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  Enregistrer une heure
                </button>
              </form>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
              Avis technique
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
              <p className="font-medium text-stone-950">
                {data.review?.title ?? "Aucun avis technique disponible"}
              </p>
              <p className="mt-3">
                Constats : {data.review?.findings ?? "Aucun constat renseigne."}
              </p>
              <p className="mt-3">
                Recommandations :{" "}
                {data.review?.recommendations ?? "Aucune recommandation renseignee."}
              </p>
              <p className="mt-3">Statut : {data.review?.status ?? "draft"}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
