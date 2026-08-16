import {
  addCalendarDays,
  dateRangesOverlap,
  differenceInCalendarDays,
} from "@/modules/opc/domain/dates";
import type {
  OpcAction,
  OpcDelayEvent,
  OpcDependency,
  OpcPrerequisite,
  OpcReservation,
  OpcScheduleResult,
  OpcTask,
} from "@/modules/opc/domain/types";

export function buildLookahead(
  tasks: OpcTask[],
  asOf: string,
  weeks: 2 | 3 | 4,
): OpcTask[] {
  const horizon = addCalendarDays(asOf, weeks * 7);
  return tasks
    .filter(
      (task) =>
        task.status !== "cancelled" &&
        task.status !== "completed" &&
        dateRangesOverlap(
          task.currentStart ?? task.plannedStart,
          task.currentEnd ?? task.plannedEnd,
          asOf,
          horizon,
        ),
    )
    .sort((left, right) =>
      (left.currentStart ?? left.plannedStart).localeCompare(
        right.currentStart ?? right.plannedStart,
      ),
    );
}

export function detectZoneConflicts(
  tasks: OpcTask[],
  schedule: OpcScheduleResult[],
) {
  const scheduleByTask = new Map(schedule.map((item) => [item.taskId, item]));
  const taskPeriods = new Map(
    tasks.map((task) => {
      const item = scheduleByTask.get(task.id);
      return [
        task.id,
        {
          start:
            item?.calculatedStart ?? task.currentStart ?? task.plannedStart,
          end: item?.calculatedEnd ?? task.currentEnd ?? task.plannedEnd,
        },
      ] as const;
    }),
  );
  const tasksByZone = new Map<string, OpcTask[]>();
  for (const task of tasks) {
    for (const zoneId of task.zoneIds) {
      const zoneTasks = tasksByZone.get(zoneId) ?? [];
      zoneTasks.push(task);
      tasksByZone.set(zoneId, zoneTasks);
    }
  }
  const conflicts: Array<{
    leftTaskId: string;
    rightTaskId: string;
    zoneId: string;
    severity: "warning" | "critical";
  }> = [];
  const knownConflicts = new Set<string>();

  for (const [zoneId, zoneTasks] of tasksByZone) {
    const sortedTasks = zoneTasks.toSorted((left, right) =>
      taskPeriods
        .get(left.id)!
        .start.localeCompare(taskPeriods.get(right.id)!.start),
    );
    for (let leftIndex = 0; leftIndex < sortedTasks.length; leftIndex += 1) {
      const left = sortedTasks[leftIndex]!;
      const leftPeriod = taskPeriods.get(left.id)!;

      for (
        let rightIndex = leftIndex + 1;
        rightIndex < sortedTasks.length;
        rightIndex += 1
      ) {
        const right = sortedTasks[rightIndex]!;
        const rightPeriod = taskPeriods.get(right.id)!;
        if (rightPeriod.start > leftPeriod.end) break;
        if (left.companyId === right.companyId) continue;

        const conflictKey = [left.id, right.id, zoneId].sort().join(":");
        if (knownConflicts.has(conflictKey)) continue;
        if (
          !dateRangesOverlap(
            leftPeriod.start,
            leftPeriod.end,
            rightPeriod.start,
            rightPeriod.end,
          )
        ) {
          continue;
        }

        knownConflicts.add(conflictKey);
        const leftSchedule = scheduleByTask.get(left.id);
        const rightSchedule = scheduleByTask.get(right.id);
        conflicts.push({
          leftTaskId: left.id,
          rightTaskId: right.id,
          zoneId,
          severity:
            leftSchedule?.isCritical || rightSchedule?.isCritical
              ? "critical"
              : "warning",
        });
      }
    }
  }

  return conflicts;
}

export function calculateCockpit(input: {
  tasks: OpcTask[];
  schedule: OpcScheduleResult[];
  actions: OpcAction[];
  prerequisites: OpcPrerequisite[];
  delays: OpcDelayEvent[];
  reservations: OpcReservation[];
  asOf: string;
}) {
  if (input.tasks.length === 0) {
    return { sufficientData: false as const, reason: "Données insuffisantes" };
  }

  const scheduleByTask = new Map(
    input.schedule.map((item) => [item.taskId, item]),
  );
  const lateTasks = input.tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      (task.currentEnd ?? task.plannedEnd) < input.asOf,
  );
  const nextMilestones = input.tasks.filter(
    (task) =>
      task.isMilestone &&
      task.plannedEnd >= input.asOf &&
      differenceInCalendarDays(task.plannedEnd, input.asOf) <= 30,
  );
  const taskDelayDays = input.tasks.map((task) =>
    Math.max(
      0,
      differenceInCalendarDays(
        task.currentEnd ?? task.plannedEnd,
        task.plannedEnd,
      ),
    ),
  );

  return {
    sufficientData: true as const,
    taskCount: input.tasks.length,
    criticalTaskCount: input.tasks.filter(
      (task) => scheduleByTask.get(task.id)?.isCritical,
    ).length,
    quasiCriticalTaskCount: input.tasks.filter(
      (task) => scheduleByTask.get(task.id)?.isQuasiCritical,
    ).length,
    lateTaskCount: lateTasks.length,
    cumulativeDelayDays: taskDelayDays.reduce((sum, days) => sum + days, 0),
    blockingPrerequisiteCount: input.prerequisites.filter(
      (item) => item.status === "missing" || item.status === "requested",
    ).length,
    overdueActionCount: input.actions.filter(
      (action) =>
        action.status !== "done" &&
        action.status !== "cancelled" &&
        action.dueOn < input.asOf,
    ).length,
    openReservationCount: input.reservations.filter(
      (reservation) => reservation.status !== "closed",
    ).length,
    blockingReservationCount: input.reservations.filter(
      (reservation) =>
        reservation.status !== "closed" && reservation.severity === "blocking",
    ).length,
    declaredDelayDays: input.delays.reduce(
      (sum, delay) => sum + delay.delayDays,
      0,
    ),
    nextMilestones: nextMilestones.slice(0, 5),
  };
}

export function simulateDelayImpact(input: {
  taskId: string;
  delayDays: number;
  tasks: OpcTask[];
  dependencies: OpcDependency[];
  baseline: OpcScheduleResult[];
  recalculated: OpcScheduleResult[];
}) {
  const baselineById = new Map(
    input.baseline.map((item) => [item.taskId, item]),
  );
  const recalculatedById = new Map(
    input.recalculated.map((item) => [item.taskId, item]),
  );
  const delayedTaskBaseline = baselineById.get(input.taskId);
  const impactedTaskIds = input.tasks
    .filter((task) => {
      const before = baselineById.get(task.id);
      const after = recalculatedById.get(task.id);
      return (
        before &&
        after &&
        after.earliestFinishOffset > before.earliestFinishOffset
      );
    })
    .map((task) => task.id);

  return {
    absorbedDays: Math.min(
      input.delayDays,
      delayedTaskBaseline?.totalFloatDays ?? 0,
    ),
    netProjectDelayDays: Math.max(
      0,
      Math.max(
        ...input.recalculated.map((item) => item.earliestFinishOffset),
        0,
      ) -
        Math.max(...input.baseline.map((item) => item.earliestFinishOffset), 0),
    ),
    impactedTaskIds,
    impactedCompanyIds: Array.from(
      new Set(
        input.tasks
          .filter((task) => impactedTaskIds.includes(task.id))
          .map((task) => task.companyId)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
    impactedMilestoneIds: input.tasks
      .filter((task) => task.isMilestone && impactedTaskIds.includes(task.id))
      .map((task) => task.id),
  };
}
