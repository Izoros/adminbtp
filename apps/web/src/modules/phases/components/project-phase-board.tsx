import type { ProjectRole } from "@/modules/projects/types/project";
import type {
  PhaseAlert,
  PhaseChecklistItem,
  ProjectPhase,
} from "@/modules/phases/types/project-phase";
import {
  canTransitionPhaseToCompleted,
  getChecklistForPhase,
  getPhaseProfileFromProjectRole,
  getPhasesForProfile,
  getRecommendedNextStatus,
} from "@/modules/phases/services/phase-rules";

type ProjectPhaseBoardProps = {
  activeRole: ProjectRole;
  phases: ProjectPhase[];
  checklistItems: PhaseChecklistItem[];
  alerts: PhaseAlert[];
  source: "supabase";
  sourceDetail: string;
  toggleChecklistAction: (formData: FormData) => Promise<void>;
  updatePhaseStatusAction: (formData: FormData) => Promise<void>;
  resolveAlertAction: (formData: FormData) => Promise<void>;
};

export function ProjectPhaseBoard({
  activeRole,
  phases,
  checklistItems,
  alerts,
  sourceDetail,
  toggleChecklistAction,
  updatePhaseStatusAction,
  resolveAlertAction,
}: ProjectPhaseBoardProps) {
  const profile = getPhaseProfileFromProjectRole(activeRole);

  if (!profile) {
    return (
      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 text-sm text-stone-700">
        Ce role n&apos;utilise pas encore de parcours de phase dedie.
      </div>
    );
  }

  const visiblePhases = getPhasesForProfile(profile, phases);

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
          Phases
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Phases chantier configurables
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
          La vue change selon le profil metier et bloque le passage a l&apos;etat
          termine tant que les items obligatoires ne sont pas completes.
        </p>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          <p className="font-medium text-stone-950">
            Source : Supabase
          </p>
          <p className="mt-1">{sourceDetail}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {visiblePhases.map((phase) => {
          const phaseChecklist = getChecklistForPhase(phase.id, checklistItems);
          const phaseAlerts = alerts.filter((alert) => alert.phaseId === phase.id);
          const canComplete = canTransitionPhaseToCompleted(phase.id, checklistItems);
          const nextStatus = getRecommendedNextStatus(
            phase.id,
            phase.status,
            checklistItems,
          );

          return (
            <article
              key={phase.id}
              className="rounded-[1.75rem] border border-stone-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                    {phase.code}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                    {phase.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-700">
                    {phase.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  <p>Statut courant : {phase.status}</p>
                  <p className="mt-1">Statut propose : {nextStatus}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                    Checklist
                  </p>
                  <ul className="mt-4 space-y-3">
                    {phaseChecklist.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <span className="font-medium text-stone-950">
                              {item.isCompleted ? "OK" : "En attente"}
                            </span>{" "}
                            {item.label}
                          </div>
                          <form action={toggleChecklistAction}>
                            <input type="hidden" name="checklistItemId" value={item.id} />
                            <input
                              type="hidden"
                              name="nextCompletedValue"
                              value={item.isCompleted ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                            >
                              {item.isCompleted ? "Reouvrir" : "Valider"}
                            </button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-amber-200/70 bg-[linear-gradient(135deg,#fffaf4_0%,#f8efe0_100%)] p-5">
                    <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                      Transition
                    </p>
                    <p className="mt-3 text-sm leading-7 text-stone-700">
                      {canComplete
                        ? "Le passage de phase est autorise: tous les points obligatoires sont completes."
                        : "Le passage de phase reste bloque: il manque au moins un point obligatoire."}
                    </p>
                    <form action={updatePhaseStatusAction} className="mt-4">
                      <input type="hidden" name="phaseId" value={phase.id} />
                      <input type="hidden" name="nextStatus" value={nextStatus} />
                      <button
                        type="submit"
                        className="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-800"
                      >
                        Appliquer le statut {nextStatus}
                      </button>
                    </form>
                  </div>

                  <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                    <p className="text-xs font-medium tracking-[0.18em] text-stone-500 uppercase">
                      Alertes
                    </p>
                    <div className="mt-4 space-y-3">
                      {phaseAlerts.length === 0 ? (
                        <p className="text-sm text-stone-600">Aucune alerte active pour cette phase.</p>
                      ) : (
                        phaseAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                          >
                            <p className="text-sm font-medium text-stone-950">
                              {alert.title}
                            </p>
                            <p className="mt-2 text-sm text-stone-700">
                              {alert.message}
                            </p>
                            <p className="mt-2 text-xs text-stone-500">
                              Statut : {alert.isResolved ? "Resolue" : "Active"}
                            </p>
                            {!alert.isResolved ? (
                              <form action={resolveAlertAction} className="mt-3">
                                <input type="hidden" name="alertId" value={alert.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                                >
                                  Marquer comme resolue
                                </button>
                              </form>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
