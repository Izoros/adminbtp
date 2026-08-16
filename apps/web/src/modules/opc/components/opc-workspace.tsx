import Link from "next/link";

import {
  buildLookahead,
  calculateCockpit,
  detectZoneConflicts,
} from "@/modules/opc/domain/coordination";
import {
  buildProgressCurve,
  calculateWeightedProgress,
} from "@/modules/opc/domain/progress";
import type { OpcModuleData } from "@/modules/opc/services/opc-data";
import { OpcGantt } from "@/modules/opc/components/opc-gantt";

const views = [
  ["cockpit", "Cockpit"],
  ["planning", "Planning"],
  ["lookahead", "3 semaines"],
  ["milestones", "Jalons"],
  ["companies", "Entreprises / lots"],
  ["zones", "Zones"],
  ["meetings", "Reunions"],
  ["actions", "Actions"],
  ["delays", "Retards"],
  ["progress", "Avancement"],
  ["reception", "OPR / reception"],
  ["reports", "Rapports"],
  ["history", "Historique planning"],
] as const;

export type OpcWorkspaceView = (typeof views)[number][0];

const feedbackMessages: Record<
  string,
  { tone: "success" | "error"; message: string }
> = {
  task_saved: { tone: "success", message: "La tache OPC a ete enregistree." },
  dependency_saved: {
    tone: "success",
    message: "La dependance a ete enregistree et le reseau recalcule.",
  },
  progress_saved: {
    tone: "success",
    message: "L'avancement terrain a ete historise.",
  },
  baseline_saved: {
    tone: "success",
    message: "La baseline immuable a ete creee.",
  },
  action_saved: {
    tone: "success",
    message: "L'action de coordination a ete creee.",
  },
  meeting_saved: {
    tone: "success",
    message: "La reunion OPC a ete planifiee.",
  },
  delay_saved: {
    tone: "success",
    message: "Le retard et sa cause ont ete historises.",
  },
  reception_saved: {
    tone: "success",
    message: "L'etape de reception a ete creee.",
  },
  reservation_saved: {
    tone: "success",
    message: "La reserve OPR a ete enregistree.",
  },
  cycle: {
    tone: "error",
    message: "Dependance refusee : elle creerait un cycle dans le planning.",
  },
  access_denied: {
    tone: "error",
    message: "Votre role OPC ne permet pas cette modification.",
  },
  invalid_task: {
    tone: "error",
    message: "La tache est incomplete ou ses dates sont invalides.",
  },
  invalid_dependency: {
    tone: "error",
    message: "La dependance demandee est invalide.",
  },
  invalid_progress: {
    tone: "error",
    message: "L'avancement doit etre compris entre 0 et 100 %.",
  },
  invalid_baseline: {
    tone: "error",
    message: "Le nom de la baseline est obligatoire.",
  },
  invalid_action: {
    tone: "error",
    message: "Le titre et l'echeance de l'action sont obligatoires.",
  },
  invalid_meeting: { tone: "error", message: "La reunion est incomplete." },
  invalid_delay: {
    tone: "error",
    message: "Le retard doit viser une tache et un nombre de jours positif.",
  },
  invalid_reception: {
    tone: "error",
    message: "L'etape de reception est incomplete.",
  },
  invalid_reservation: {
    tone: "error",
    message: "La reference et le titre de la reserve sont obligatoires.",
  },
  error: {
    tone: "error",
    message: "L'operation OPC a echoue. Aucune donnee n'a ete inventee.",
  },
};

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-stone-500">{detail}</p> : null}
    </article>
  );
}

function EmptyData({
  children = "Données insuffisantes",
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-sm font-medium text-amber-950">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm text-stone-700">
      <span className="font-medium text-stone-900">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm";

export function OpcWorkspace({
  data,
  view,
  feedback,
  asOf,
  actions,
}: {
  data: OpcModuleData;
  view: OpcWorkspaceView;
  feedback?: string;
  asOf: string;
  actions: {
    saveTask: (formData: FormData) => Promise<void>;
    createDependency: (formData: FormData) => Promise<void>;
    recordProgress: (formData: FormData) => Promise<void>;
    createBaseline: (formData: FormData) => Promise<void>;
    createAction: (formData: FormData) => Promise<void>;
    createMeeting: (formData: FormData) => Promise<void>;
    declareDelay: (formData: FormData) => Promise<void>;
    createReception: (formData: FormData) => Promise<void>;
    createReservation: (formData: FormData) => Promise<void>;
  };
}) {
  const workspace = data.workspace;
  const selectedProjectId = data.selectedProjectId;
  const feedbackMessage = feedback ? feedbackMessages[feedback] : undefined;
  const cockpit = workspace
    ? calculateCockpit({
        tasks: workspace.tasks,
        schedule: data.schedule,
        actions: workspace.actions,
        prerequisites: workspace.prerequisites,
        delays: workspace.delays,
        reservations: workspace.reservations,
        asOf,
      })
    : null;
  const progress = workspace
    ? calculateWeightedProgress(workspace.tasks, asOf)
    : null;
  const lookahead = workspace ? buildLookahead(workspace.tasks, asOf, 3) : [];
  const conflicts = workspace
    ? detectZoneConflicts(workspace.tasks, data.schedule)
    : [];

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
              Module OPC
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
              Ordonnancement, pilotage et coordination
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
              Planning contractuel, chemin critique, marges, coordination des
              entreprises, actions, retards, OPR et tracabilite dans un meme
              espace chantier.
            </p>
          </div>
          <form method="get" action="/opc" className="min-w-72 space-y-2">
            <label
              htmlFor="opc-project"
              className="text-xs font-medium text-stone-600"
            >
              Chantier actif
            </label>
            <select
              id="opc-project"
              name="projectId"
              defaultValue={selectedProjectId ?? ""}
              className={fieldClass}
            >
              {data.projects.length === 0 ? (
                <option value="">Aucun chantier</option>
              ) : null}
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.name}
                </option>
              ))}
            </select>
            <button className="w-full rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
              Ouvrir le chantier
            </button>
          </form>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
            {data.detail}
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">
            {data.canEdit
              ? "Edition OPC"
              : data.canContribute
                ? "Contribution entreprise"
                : "Lecture seule"}
          </span>
        </div>
        {feedbackMessage ? (
          <p
            role="status"
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${feedbackMessage.tone === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-400 bg-rose-100 text-rose-950"}`}
          >
            {feedbackMessage.message}
          </p>
        ) : null}
      </header>

      <nav
        className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2"
        aria-label="Navigation OPC"
      >
        {views.map(([value, label]) => (
          <Link
            key={value}
            href={`/opc?projectId=${selectedProjectId ?? ""}&view=${value}`}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ${view === value ? "bg-stone-950 text-white" : "bg-stone-50 text-stone-700 hover:bg-stone-100"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {data.status !== "ready" && data.status !== "invalid_network" ? (
        <EmptyData>{data.detail}</EmptyData>
      ) : null}
      {data.status === "invalid_network" ? (
        <div className="rounded-2xl border border-rose-400 bg-rose-100 p-5 text-sm font-medium text-rose-950">
          Planning incoherent : {data.detail}. Corrigez les dependances avant
          tout recalcul.
        </div>
      ) : null}

      {workspace && view === "cockpit" ? (
        cockpit?.sufficientData ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Taches critiques"
                value={cockpit.criticalTaskCount}
                detail={`${cockpit.quasiCriticalTaskCount} quasi critiques`}
              />
              <Metric
                label="Taches en retard"
                value={cockpit.lateTaskCount}
                detail={`${cockpit.cumulativeDelayDays} jours cumules`}
              />
              <Metric
                label="Prerequis bloquants"
                value={cockpit.blockingPrerequisiteCount}
              />
              <Metric
                label="Actions echues"
                value={cockpit.overdueActionCount}
              />
              <Metric
                label="Avancement reel"
                value={
                  progress?.actualPercent === null
                    ? "Données insuffisantes"
                    : `${progress?.actualPercent.toFixed(1)} %`
                }
              />
              <Metric
                label="Avancement planifie"
                value={
                  progress?.plannedPercent === null
                    ? "Données insuffisantes"
                    : `${progress?.plannedPercent.toFixed(1)} %`
                }
              />
              <Metric
                label="Reserves ouvertes"
                value={cockpit.openReservationCount}
                detail={`${cockpit.blockingReservationCount} bloquante(s)`}
              />
              <Metric
                label="Retards declares"
                value={`${cockpit.declaredDelayDays} j`}
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-semibold text-stone-950">
                  Prochains jalons a 30 jours
                </h2>
                {cockpit.nextMilestones.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm text-stone-700">
                    {cockpit.nextMilestones.map((task) => (
                      <li key={task.id}>
                        {task.plannedEnd} · {task.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-stone-500">
                    Aucun jalon dans la fenetre.
                  </p>
                )}
              </article>
              <article className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-semibold text-stone-950">
                  Tensions detectees
                </h2>
                <p className="mt-3 text-sm text-stone-600">
                  {conflicts.length} conflit(s) de zone calcules sur les
                  periodes qui se chevauchent.
                </p>
              </article>
            </div>
          </div>
        ) : (
          <EmptyData />
        )
      ) : null}

      {workspace && view === "planning" ? (
        <div className="space-y-6">
          {workspace.tasks.length > 0 &&
          workspace.project.startsOn &&
          workspace.project.endsOn ? (
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
              <OpcGantt
                tasks={workspace.tasks.map((task) => ({
                  id: task.id,
                  code: task.code,
                  name: task.name,
                  plannedStart: task.plannedStart,
                  plannedEnd: task.plannedEnd,
                  currentStart: task.currentStart,
                  currentEnd: task.currentEnd,
                  actualStart: task.actualStart,
                  actualEnd: task.actualEnd,
                  progressPercent: task.progressPercent,
                  status: task.status,
                  lotId: task.lotId,
                  companyId: task.companyId,
                  zoneIds: task.zoneIds,
                  isMilestone: task.isMilestone,
                }))}
                schedule={data.schedule.map((item) => ({
                  taskId: item.taskId,
                  totalFloatDays: item.totalFloatDays,
                  isCritical: item.isCritical,
                }))}
                projectStart={workspace.project.startsOn}
                projectEnd={workspace.project.endsOn}
              />
            </div>
          ) : (
            <EmptyData>
              Ajoutez une premiere tache et renseignez les dates du chantier
              pour calculer le Gantt.
            </EmptyData>
          )}

          {data.canEdit ? (
            <div className="grid gap-5 xl:grid-cols-3">
              <details
                className="rounded-2xl border border-stone-200 bg-white p-5"
                open
              >
                <summary className="cursor-pointer font-semibold text-stone-950">
                  Ajouter une tache ou un jalon
                </summary>
                <form action={actions.saveTask} className="mt-4 space-y-3">
                  <input
                    type="hidden"
                    name="projectId"
                    value={workspace.project.id}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Code">
                      <input required name="code" className={fieldClass} />
                    </Field>
                    <Field label="Nom">
                      <input required name="name" className={fieldClass} />
                    </Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Debut">
                      <input
                        required
                        type="date"
                        name="plannedStart"
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Fin">
                      <input
                        required
                        type="date"
                        name="plannedEnd"
                        className={fieldClass}
                      />
                    </Field>
                  </div>
                  <Field label="Duree en jours">
                    <input
                      min="0"
                      type="number"
                      name="durationDays"
                      className={fieldClass}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label>
                      <input type="checkbox" name="isMilestone" /> Jalon
                    </label>
                    <label>
                      <input type="checkbox" name="isContractualMilestone" />{" "}
                      Contractuel
                    </label>
                  </div>
                  <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                    Enregistrer
                  </button>
                </form>
              </details>
              <details className="rounded-2xl border border-stone-200 bg-white p-5">
                <summary className="cursor-pointer font-semibold text-stone-950">
                  Ajouter une dependance
                </summary>
                <form
                  action={actions.createDependency}
                  className="mt-4 space-y-3"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={workspace.project.id}
                  />
                  <Field label="Predecesseur">
                    <select
                      required
                      name="predecessorId"
                      className={fieldClass}
                    >
                      {workspace.tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.code} · {task.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Successeur">
                    <select required name="successorId" className={fieldClass}>
                      {workspace.tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.code} · {task.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type">
                      <select name="dependencyType" className={fieldClass}>
                        {["FS", "SS", "FF", "SF"].map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Decalage (j)">
                      <input
                        type="number"
                        name="lagDays"
                        defaultValue="0"
                        className={fieldClass}
                      />
                    </Field>
                  </div>
                  <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                    Relier
                  </button>
                </form>
              </details>
              <details className="rounded-2xl border border-stone-200 bg-white p-5">
                <summary className="cursor-pointer font-semibold text-stone-950">
                  Figer une baseline
                </summary>
                <form
                  action={actions.createBaseline}
                  className="mt-4 space-y-3"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={workspace.project.id}
                  />
                  <Field label="Nom de version">
                    <input
                      required
                      name="name"
                      placeholder="Planning marche V1"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      name="description"
                      className={fieldClass}
                      rows={3}
                    />
                  </Field>
                  <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                    Creer la baseline immuable
                  </button>
                </form>
              </details>
            </div>
          ) : null}
        </div>
      ) : null}

      {workspace && view === "lookahead" ? (
        lookahead.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lookahead.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-stone-200 bg-white p-5"
              >
                <p className="text-xs text-stone-500">
                  {task.currentStart ?? task.plannedStart} →{" "}
                  {task.currentEnd ?? task.plannedEnd}
                </p>
                <h2 className="mt-2 font-semibold text-stone-950">
                  {task.code} · {task.name}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  Statut : {task.status} · {task.progressPercent}%
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyData>
            Aucune tache active dans les trois prochaines semaines.
          </EmptyData>
        )
      ) : null}

      {workspace && view === "milestones" ? (
        workspace.tasks.some((task) => task.isMilestone) ? (
          <div className="space-y-3">
            {workspace.tasks
              .filter((task) => task.isMilestone)
              .map((task) => (
                <article
                  key={task.id}
                  className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-stone-950">{task.name}</p>
                    <p className="text-sm text-stone-500">
                      {task.isContractualMilestone
                        ? "Jalon contractuel"
                        : "Jalon interne"}
                    </p>
                  </div>
                  <span className="font-mono text-sm">{task.plannedEnd}</span>
                </article>
              ))}
          </div>
        ) : (
          <EmptyData>Aucun jalon n&apos;a ete defini.</EmptyData>
        )
      ) : null}

      {workspace && view === "companies" ? (
        workspace.lots.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspace.lots.map((lot) => (
              <article
                key={lot.id}
                className="rounded-2xl border border-stone-200 bg-white p-5"
              >
                <p className="text-xs text-stone-500">{lot.code}</p>
                <h2 className="mt-2 font-semibold text-stone-950">
                  {lot.name}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  {
                    workspace.tasks.filter((task) => task.lotId === lot.id)
                      .length
                  }{" "}
                  tache(s) · entreprise {lot.companyId ?? "non affectee"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyData>
            Aucun lot ni entreprise OPC n&apos;a encore ete parametre.
          </EmptyData>
        )
      ) : null}

      {workspace && view === "zones" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Arborescence des zones</h2>
            {workspace.zones.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {workspace.zones.map((zone) => (
                  <li key={zone.id}>
                    {zone.code} · {zone.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-500">
                Données insuffisantes
              </p>
            )}
          </article>
          <article className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Conflits calcules</h2>
            {conflicts.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {conflicts.map((conflict) => (
                  <li key={`${conflict.leftTaskId}-${conflict.rightTaskId}`}>
                    {conflict.zoneId} · {conflict.leftTaskId} /{" "}
                    {conflict.rightTaskId} · {conflict.severity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-500">
                Aucun conflit detecte avec les donnees actuelles.
              </p>
            )}
          </article>
        </div>
      ) : null}

      {workspace && view === "meetings" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          {workspace.meetings.length > 0 ? (
            <div className="space-y-3">
              {workspace.meetings.map((meeting) => (
                <article
                  key={meeting.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <p className="text-xs text-stone-500">
                    {meeting.scheduledAt} · {meeting.meetingType}
                  </p>
                  <h2 className="mt-2 font-semibold">{meeting.title}</h2>
                  <p className="mt-2 text-sm">Statut : {meeting.status}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyData>
              Aucune reunion OPC n&apos;a encore ete planifiee.
            </EmptyData>
          )}
          {data.canEdit ? (
            <form
              action={actions.createMeeting}
              className="h-fit space-y-3 rounded-2xl border border-stone-200 bg-white p-5"
            >
              <h2 className="font-semibold">Planifier une reunion</h2>
              <input
                type="hidden"
                name="projectId"
                value={workspace.project.id}
              />
              <Field label="Titre">
                <input required name="title" className={fieldClass} />
              </Field>
              <Field label="Date et heure">
                <input
                  required
                  type="datetime-local"
                  name="scheduledAt"
                  className={fieldClass}
                />
              </Field>
              <Field label="Type">
                <select name="meetingType" className={fieldClass}>
                  <option value="site">Chantier</option>
                  <option value="coordination">Coordination</option>
                  <option value="planning">Planning</option>
                  <option value="opr">OPR</option>
                  <option value="reception">Reception</option>
                </select>
              </Field>
              <Field label="Lieu">
                <input name="location" className={fieldClass} />
              </Field>
              <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Planifier
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {workspace && view === "actions" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          {workspace.actions.length > 0 ? (
            <div className="space-y-3">
              {workspace.actions.map((action) => (
                <article
                  key={action.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <p className="text-xs text-stone-500">
                    Echeance {action.dueOn} · {action.priority}
                  </p>
                  <h2 className="mt-2 font-semibold">{action.title}</h2>
                  <p className="mt-2 text-sm">{action.status}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyData>Aucune action de coordination.</EmptyData>
          )}
          {data.canContribute ? (
            <form
              action={actions.createAction}
              className="h-fit space-y-3 rounded-2xl border border-stone-200 bg-white p-5"
            >
              <h2 className="font-semibold">Nouvelle action</h2>
              <input
                type="hidden"
                name="projectId"
                value={workspace.project.id}
              />
              <Field label="Titre">
                <input required name="title" className={fieldClass} />
              </Field>
              <Field label="Echeance">
                <input
                  required
                  type="date"
                  name="dueOn"
                  className={fieldClass}
                />
              </Field>
              <Field label="Priorite">
                <select name="priority" className={fieldClass}>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </Field>
              <Field label="Tache liee">
                <select name="taskId" className={fieldClass}>
                  <option value="">Aucune</option>
                  {workspace.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.code} · {task.name}
                    </option>
                  ))}
                </select>
              </Field>
              <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Creer l&apos;action
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {workspace && view === "delays" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          {workspace.delays.length > 0 ? (
            <div className="space-y-3">
              {workspace.delays.map((delay) => (
                <article
                  key={delay.id}
                  className="rounded-2xl border border-rose-200 bg-white p-5"
                >
                  <p className="text-xs text-rose-700">
                    {delay.occurredOn} · +{delay.delayDays} j ·{" "}
                    {delay.causeCategory}
                  </p>
                  <h2 className="mt-2 font-semibold">{delay.cause}</h2>
                </article>
              ))}
            </div>
          ) : (
            <EmptyData>
              Aucun retard n&apos;a ete declare. Les ecarts calcules restent
              visibles au cockpit.
            </EmptyData>
          )}
          {data.canEdit && workspace.tasks.length > 0 ? (
            <form
              action={actions.declareDelay}
              className="h-fit space-y-3 rounded-2xl border border-rose-200 bg-white p-5"
            >
              <h2 className="font-semibold">Declarer un retard</h2>
              <input
                type="hidden"
                name="projectId"
                value={workspace.project.id}
              />
              <Field label="Tache">
                <select required name="taskId" className={fieldClass}>
                  {workspace.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.code} · {task.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cause">
                <input required name="cause" className={fieldClass} />
              </Field>
              <Field label="Categorie">
                <select name="causeCategory" className={fieldClass}>
                  <option value="company">Entreprise</option>
                  <option value="client">Client</option>
                  <option value="design">Etudes</option>
                  <option value="weather">Meteo</option>
                  <option value="supply">Approvisionnement</option>
                  <option value="administrative">Administratif</option>
                  <option value="interface">Interface</option>
                  <option value="other">Autre</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jours">
                  <input
                    required
                    min="1"
                    type="number"
                    name="delayDays"
                    className={fieldClass}
                  />
                </Field>
                <Field label="Survenu le">
                  <input
                    required
                    type="date"
                    name="occurredOn"
                    defaultValue={asOf}
                    className={fieldClass}
                  />
                </Field>
              </div>
              <button className="rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white">
                Historiser le retard
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {workspace && view === "progress" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <article className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Courbe d&apos;avancement ponderee</h2>
            {workspace.project.startsOn &&
            workspace.project.endsOn &&
            workspace.tasks.length > 0 ? (
              <div className="mt-5 flex h-64 items-end gap-1 overflow-x-auto">
                {buildProgressCurve({
                  tasks: workspace.tasks,
                  startsOn: workspace.project.startsOn,
                  endsOn: workspace.project.endsOn,
                })
                  .slice(-24)
                  .map((sample) => (
                    <div
                      key={sample.date}
                      className="group flex min-w-5 flex-1 items-end gap-px"
                      title={`${sample.date} · planifie ${sample.plannedPercent?.toFixed(1)}% · reel ${sample.actualPercent?.toFixed(1)}%`}
                    >
                      <div
                        className="w-1/2 bg-amber-400"
                        style={{ height: `${sample.plannedPercent ?? 0}%` }}
                      />
                      <div
                        className="w-1/2 bg-emerald-600"
                        style={{ height: `${sample.actualPercent ?? 0}%` }}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm">Données insuffisantes</p>
            )}
          </article>
          {data.canContribute && workspace.tasks.length > 0 ? (
            <form
              action={actions.recordProgress}
              className="h-fit space-y-3 rounded-2xl border border-stone-200 bg-white p-5"
            >
              <h2 className="font-semibold">Releve terrain</h2>
              <input
                type="hidden"
                name="projectId"
                value={workspace.project.id}
              />
              <Field label="Tache">
                <select required name="taskId" className={fieldClass}>
                  {workspace.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.code} · {task.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Avancement %">
                <input
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  type="number"
                  name="progressPercent"
                  className={fieldClass}
                />
              </Field>
              <Field label="Date du releve">
                <input
                  type="date"
                  name="measuredOn"
                  defaultValue={asOf}
                  className={fieldClass}
                />
              </Field>
              <Field label="Commentaire">
                <textarea name="comment" rows={3} className={fieldClass} />
              </Field>
              <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Historiser
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {workspace && view === "reception" ? (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-semibold">Etapes OPR et reception</h2>
              {workspace.receptions.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm">
                  {workspace.receptions.map((reception) => (
                    <li key={reception.id}>
                      <span className="font-medium">{reception.title}</span>
                      <br />
                      <span className="text-stone-500">
                        {reception.receptionType} ·{" "}
                        {reception.plannedOn ?? "date non fixee"} ·{" "}
                        {reception.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-stone-500">
                  Données insuffisantes
                </p>
              )}
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-semibold">Reserves</h2>
              {workspace.reservations.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm">
                  {workspace.reservations.map((reservation) => (
                    <li key={reservation.id}>
                      <span className="font-medium">{reservation.title}</span>
                      <br />
                      <span className="text-stone-500">
                        {reservation.severity} · {reservation.status} · echeance{" "}
                        {reservation.dueOn ?? "non fixee"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-stone-500">
                  Aucune reserve enregistree.
                </p>
              )}
            </article>
          </div>
          {data.canEdit ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <form
                action={actions.createReception}
                className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5"
              >
                <h2 className="font-semibold">Nouvelle etape de reception</h2>
                <input
                  type="hidden"
                  name="projectId"
                  value={workspace.project.id}
                />
                <Field label="Titre">
                  <input required name="title" className={fieldClass} />
                </Field>
                <Field label="Type">
                  <select name="receptionType" className={fieldClass}>
                    <option value="opr">OPR</option>
                    <option value="pre_reception">Pre-reception</option>
                    <option value="reception">Reception</option>
                    <option value="partial_reception">
                      Reception partielle
                    </option>
                    <option value="gpa">GPA</option>
                  </select>
                </Field>
                <Field label="Date prevue">
                  <input type="date" name="plannedOn" className={fieldClass} />
                </Field>
                <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                  Creer l&apos;etape
                </button>
              </form>
              <form
                action={actions.createReservation}
                className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5"
              >
                <h2 className="font-semibold">Nouvelle reserve</h2>
                <input
                  type="hidden"
                  name="projectId"
                  value={workspace.project.id}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reference">
                    <input
                      required
                      name="reference"
                      placeholder="RSV-001"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Severite">
                    <select name="severity" className={fieldClass}>
                      <option value="minor">Mineure</option>
                      <option value="major">Majeure</option>
                      <option value="blocking">Bloquante</option>
                    </select>
                  </Field>
                </div>
                <Field label="Titre">
                  <input required name="title" className={fieldClass} />
                </Field>
                <Field label="Reception liee">
                  <select name="receptionId" className={fieldClass}>
                    <option value="">Aucune</option>
                    {workspace.receptions.map((reception) => (
                      <option key={reception.id} value={reception.id}>
                        {reception.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tache liee">
                  <select name="taskId" className={fieldClass}>
                    <option value="">Aucune</option>
                    {workspace.tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.code} · {task.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Echeance">
                  <input type="date" name="dueOn" className={fieldClass} />
                </Field>
                <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                  Enregistrer la reserve
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}

      {workspace && view === "reports" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Rapport PDF OPC</h2>
            <p className="mt-2 text-sm text-stone-600">
              Synthese datee des KPI et du planning, generee depuis les donnees
              autorisees.
            </p>
            <a
              href={`/opc/export?projectId=${workspace.project.id}&format=pdf`}
              className="mt-4 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
            >
              Telecharger le PDF
            </a>
          </article>
          <article className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Export tableur</h2>
            <p className="mt-2 text-sm text-stone-600">
              Taches, dates, avancement, marges et criticite pour controle
              externe.
            </p>
            <a
              href={`/opc/export?projectId=${workspace.project.id}&format=xlsx`}
              className="mt-4 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
            >
              Telecharger le XLSX
            </a>
          </article>
        </div>
      ) : null}

      {workspace && view === "history" ? (
        workspace.planningVersions.length > 0 ? (
          <div className="space-y-3">
            {workspace.planningVersions.map((version) => (
              <article
                key={version.id}
                className="rounded-2xl border border-stone-200 bg-white p-5"
              >
                <p className="text-xs text-stone-500">
                  Version {version.versionNumber} · {version.createdAt}
                </p>
                <h2 className="mt-2 font-semibold">{version.name}</h2>
                <p className="mt-2 text-sm">
                  {version.isBaseline
                    ? "Baseline verrouillee"
                    : "Version de travail"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyData>Aucune baseline n&apos;a encore ete figee.</EmptyData>
        )
      ) : null}
    </section>
  );
}
