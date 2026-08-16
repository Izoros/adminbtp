"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { differenceInCalendarDays } from "@/modules/opc/domain/dates";
import type { OpcScheduleResult, OpcTask } from "@/modules/opc/domain/types";

type Zoom = "day" | "week" | "month";
type GanttTask = Pick<
  OpcTask,
  | "id"
  | "code"
  | "name"
  | "plannedStart"
  | "plannedEnd"
  | "currentStart"
  | "currentEnd"
  | "actualStart"
  | "actualEnd"
  | "progressPercent"
  | "status"
  | "lotId"
  | "companyId"
  | "zoneIds"
  | "isMilestone"
>;
type GanttSchedule = Pick<
  OpcScheduleResult,
  "taskId" | "totalFloatDays" | "isCritical"
>;

const scaleByZoom: Record<Zoom, number> = { day: 28, week: 10, month: 4 };
const labelStepByZoom: Record<Zoom, number> = { day: 1, week: 7, month: 30 };

function barStyle(start: string, end: string, origin: string, scale: number) {
  const left = Math.max(0, differenceInCalendarDays(start, origin) * scale);
  const duration = Math.max(1, differenceInCalendarDays(end, start) + 1);
  return { left, width: Math.max(3, duration * scale) };
}

export function OpcGantt({
  tasks,
  schedule,
  projectStart,
  projectEnd,
}: {
  tasks: GanttTask[];
  schedule: GanttSchedule[];
  projectStart: string;
  projectEnd: string;
}) {
  const [zoom, setZoom] = useState<Zoom>("week");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [lotId, setLotId] = useState("all");
  const [companyId, setCompanyId] = useState("all");
  const [zoneId, setZoneId] = useState("all");
  const [visibleLimit, setVisibleLimit] = useState(100);
  const deferredQuery = useDeferredValue(query);
  const scheduleByTask = useMemo(
    () => new Map(schedule.map((item) => [item.taskId, item])),
    [schedule],
  );
  const scale = scaleByZoom[zoom];
  const totalDays = Math.max(
    1,
    differenceInCalendarDays(projectEnd, projectStart) + 1,
  );
  const timelineWidth = Math.max(840, totalDays * scale);
  const filteredTasks = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("fr");
    return tasks.filter(
      (task) =>
        (!normalizedQuery ||
          task.name.toLocaleLowerCase("fr").includes(normalizedQuery) ||
          task.code.toLocaleLowerCase("fr").includes(normalizedQuery)) &&
        (status === "all" || task.status === status) &&
        (lotId === "all" || task.lotId === lotId) &&
        (companyId === "all" || task.companyId === companyId) &&
        (zoneId === "all" || task.zoneIds.includes(zoneId)),
    );
  }, [companyId, deferredQuery, lotId, status, tasks, zoneId]);
  const visibleTasks = filteredTasks.slice(0, visibleLimit);
  const tickOffsets = Array.from(
    { length: Math.ceil(totalDays / labelStepByZoom[zoom]) },
    (_, index) => index * labelStepByZoom[zoom],
  );
  const uniqueLots = Array.from(
    new Set(tasks.map((task) => task.lotId).filter(Boolean)),
  );
  const uniqueCompanies = Array.from(
    new Set(tasks.map((task) => task.companyId).filter(Boolean)),
  );
  const uniqueZones = Array.from(
    new Set(tasks.flatMap((task) => task.zoneIds)),
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 md:grid-cols-2 xl:grid-cols-6">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleLimit(100);
          }}
          placeholder="Rechercher code ou tache"
          aria-label="Rechercher une tache"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm xl:col-span-2"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrer par statut"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="not_started">Non demarre</option>
          <option value="ready">Pret</option>
          <option value="in_progress">En cours</option>
          <option value="blocked">Bloque</option>
          <option value="completed">Termine</option>
        </select>
        <select
          value={lotId}
          onChange={(event) => setLotId(event.target.value)}
          aria-label="Filtrer par lot"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Tous les lots</option>
          {uniqueLots.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          aria-label="Filtrer par entreprise"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Toutes entreprises</option>
          {uniqueCompanies.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={zoneId}
          onChange={(event) => setZoneId(event.target.value)}
          aria-label="Filtrer par zone"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Toutes les zones</option>
          {uniqueZones.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          {filteredTasks.length} tache(s) · rouge = critique · bleu = planning
          courant · vert = reel
        </p>
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-1">
          {(["day", "week", "month"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setZoom(value)}
              className={`rounded-full px-4 py-2 text-xs font-medium ${zoom === value ? "bg-stone-950 text-white" : "text-stone-600"}`}
            >
              {value === "day" ? "Jour" : value === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-stone-200 bg-white">
        <div className="grid min-w-max grid-cols-[280px_auto]">
          <div className="sticky left-0 z-30 border-r border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold tracking-wide text-stone-700 uppercase">
            Tache / marge
          </div>
          <div
            className="relative border-b border-stone-200 bg-stone-100"
            style={{ width: timelineWidth, minHeight: 44 }}
          >
            {tickOffsets.map((offset) => (
              <div
                key={offset}
                className="absolute inset-y-0 border-l border-stone-200 px-2 pt-3 text-[10px] text-stone-500"
                style={{ left: offset * scale }}
              >
                J+{offset}
              </div>
            ))}
          </div>

          {visibleTasks.map((task) => {
            const calculated = scheduleByTask.get(task.id);
            const planned = barStyle(
              task.plannedStart,
              task.plannedEnd,
              projectStart,
              scale,
            );
            const current =
              task.currentStart && task.currentEnd
                ? barStyle(
                    task.currentStart,
                    task.currentEnd,
                    projectStart,
                    scale,
                  )
                : null;
            const actual = task.actualStart
              ? barStyle(
                  task.actualStart,
                  task.actualEnd ?? task.actualStart,
                  projectStart,
                  scale,
                )
              : null;

            return (
              <div key={task.id} className="contents">
                <div className="sticky left-0 z-20 min-h-16 border-r border-b border-stone-100 bg-white px-4 py-3 [contain-intrinsic-size:0_64px] [content-visibility:auto]">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {task.code} · {task.name}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {task.progressPercent}% · marge{" "}
                    {calculated?.totalFloatDays ?? "—"} j
                  </p>
                </div>
                <div
                  className="relative min-h-16 border-b border-stone-100 bg-[linear-gradient(90deg,transparent_calc(100%-1px),#f5f5f4_calc(100%-1px))] [background-size:var(--grid-size)_100%] [contain-intrinsic-size:0_64px] [content-visibility:auto]"
                  style={
                    {
                      width: timelineWidth,
                      "--grid-size": `${labelStepByZoom[zoom] * scale}px`,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className={`absolute top-3 h-3 rounded-full border-2 bg-amber-100 ${calculated?.isCritical ? "border-rose-600" : "border-amber-500"}`}
                    style={planned}
                    title={`Previsionnel ${task.plannedStart} au ${task.plannedEnd}`}
                  />
                  {current ? (
                    <div
                      className="absolute top-7 h-2 rounded-full bg-sky-600"
                      style={current}
                    />
                  ) : null}
                  {actual ? (
                    <div
                      className="absolute top-10 h-2 rounded-full bg-emerald-600"
                      style={actual}
                    />
                  ) : null}
                  {task.isMilestone ? (
                    <div
                      className="absolute top-3 size-4 rotate-45 bg-stone-950"
                      style={{ left: planned.left }}
                      title="Jalon"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {visibleLimit < filteredTasks.length ? (
        <button
          type="button"
          onClick={() => setVisibleLimit((current) => current + 100)}
          className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-medium text-stone-800"
        >
          Charger 100 taches supplementaires
        </button>
      ) : null}
    </section>
  );
}
