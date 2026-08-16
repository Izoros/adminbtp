import {
  addCalendarDays,
  differenceInCalendarDays,
} from "@/modules/opc/domain/dates";
import { topologicalSort } from "@/modules/opc/domain/dependency-graph";
import type {
  OpcDependency,
  OpcScheduleResult,
  OpcTask,
} from "@/modules/opc/domain/types";

type OffsetSchedule = {
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
};

function forwardConstraint(
  dependency: OpcDependency,
  predecessor: OffsetSchedule,
  successorDuration: number,
): number {
  switch (dependency.type) {
    case "SS":
      return predecessor.earliestStart + dependency.lagDays;
    case "FF":
      return (
        predecessor.earliestFinish + dependency.lagDays - successorDuration
      );
    case "SF":
      return predecessor.earliestStart + dependency.lagDays - successorDuration;
    case "FS":
    default:
      return predecessor.earliestFinish + dependency.lagDays;
  }
}

function backwardConstraint(
  dependency: OpcDependency,
  successor: OffsetSchedule,
  predecessorDuration: number,
): number {
  switch (dependency.type) {
    case "SS":
      return successor.latestStart - dependency.lagDays + predecessorDuration;
    case "FF":
      return successor.latestFinish - dependency.lagDays;
    case "SF":
      return successor.latestFinish - dependency.lagDays + predecessorDuration;
    case "FS":
    default:
      return successor.latestStart - dependency.lagDays;
  }
}

function freeFloatForDependency(
  dependency: OpcDependency,
  predecessor: OffsetSchedule,
  successor: OffsetSchedule,
): number {
  switch (dependency.type) {
    case "SS":
      return (
        successor.earliestStart - predecessor.earliestStart - dependency.lagDays
      );
    case "FF":
      return (
        successor.earliestFinish -
        predecessor.earliestFinish -
        dependency.lagDays
      );
    case "SF":
      return (
        successor.earliestFinish -
        predecessor.earliestStart -
        dependency.lagDays
      );
    case "FS":
    default:
      return (
        successor.earliestStart -
        predecessor.earliestFinish -
        dependency.lagDays
      );
  }
}

export function calculateCriticalPath(input: {
  projectStart: string;
  tasks: OpcTask[];
  dependencies: OpcDependency[];
  quasiCriticalThresholdDays?: number;
}): OpcScheduleResult[] {
  const { projectStart, tasks, dependencies } = input;
  if (tasks.length === 0) return [];

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const order = topologicalSort(
    tasks.map((task) => task.id),
    dependencies,
  );
  const schedule = new Map<string, OffsetSchedule>();
  const incomingByTask = new Map(
    tasks.map((task) => [task.id, [] as OpcDependency[]]),
  );
  const outgoingByTask = new Map(
    tasks.map((task) => [task.id, [] as OpcDependency[]]),
  );
  for (const dependency of dependencies) {
    incomingByTask.get(dependency.successorId)?.push(dependency);
    outgoingByTask.get(dependency.predecessorId)?.push(dependency);
  }

  for (const taskId of order) {
    const task = taskById.get(taskId)!;
    const duration = Math.max(0, task.isMilestone ? 0 : task.durationDays);
    const incoming = incomingByTask.get(taskId) ?? [];
    const constraintOffset = task.constraintStart
      ? differenceInCalendarDays(task.constraintStart, projectStart)
      : 0;
    let earliestStart = Math.max(0, constraintOffset);

    for (const dependency of incoming) {
      const predecessor = schedule.get(dependency.predecessorId)!;
      earliestStart = Math.max(
        earliestStart,
        forwardConstraint(dependency, predecessor, duration),
      );
    }

    schedule.set(taskId, {
      earliestStart,
      earliestFinish: earliestStart + duration,
      latestStart: 0,
      latestFinish: 0,
    });
  }

  const projectDuration = Math.max(
    ...Array.from(schedule.values(), (item) => item.earliestFinish),
  );

  for (const taskId of [...order].reverse()) {
    const task = taskById.get(taskId)!;
    const duration = Math.max(0, task.isMilestone ? 0 : task.durationDays);
    const outgoing = outgoingByTask.get(taskId) ?? [];
    let latestFinish = projectDuration;

    for (const dependency of outgoing) {
      const successor = schedule.get(dependency.successorId)!;
      latestFinish = Math.min(
        latestFinish,
        backwardConstraint(dependency, successor, duration),
      );
    }

    const current = schedule.get(taskId)!;
    current.latestFinish = latestFinish;
    current.latestStart = latestFinish - duration;
  }

  const quasiCriticalThresholdDays = input.quasiCriticalThresholdDays ?? 3;

  return order.map((taskId) => {
    const task = taskById.get(taskId)!;
    const item = schedule.get(taskId)!;
    const outgoing = outgoingByTask.get(taskId) ?? [];
    const totalFloatDays = Math.max(0, item.latestStart - item.earliestStart);
    const freeFloatDays = Math.max(
      0,
      outgoing.length === 0
        ? projectDuration - item.earliestFinish
        : Math.min(
            ...outgoing.map((dependency) =>
              freeFloatForDependency(
                dependency,
                item,
                schedule.get(dependency.successorId)!,
              ),
            ),
          ),
    );
    const calculatedStart = addCalendarDays(projectStart, item.earliestStart);
    const calculatedEnd = task.isMilestone
      ? calculatedStart
      : addCalendarDays(
          projectStart,
          Math.max(item.earliestStart, item.earliestFinish - 1),
        );

    return {
      taskId,
      earliestStartOffset: item.earliestStart,
      earliestFinishOffset: item.earliestFinish,
      latestStartOffset: item.latestStart,
      latestFinishOffset: item.latestFinish,
      totalFloatDays,
      freeFloatDays,
      isCritical: totalFloatDays === 0,
      isQuasiCritical:
        totalFloatDays > 0 && totalFloatDays <= quasiCriticalThresholdDays,
      calculatedStart,
      calculatedEnd,
    };
  });
}
