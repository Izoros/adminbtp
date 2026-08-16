import {
  addCalendarDays,
  differenceInCalendarDays,
} from "@/modules/opc/domain/dates";
import type { OpcTask } from "@/modules/opc/domain/types";

export function resolveTaskProgress(task: OpcTask): number {
  if (
    (task.progressMode === "quantitative" || task.progressMode === "unit") &&
    task.plannedQuantity &&
    task.plannedQuantity > 0
  ) {
    return Math.min(
      100,
      Math.max(0, ((task.completedQuantity ?? 0) / task.plannedQuantity) * 100),
    );
  }

  return Math.min(100, Math.max(0, task.progressPercent));
}

export function resolvePlannedProgress(task: OpcTask, asOf: string): number {
  if (asOf < task.plannedStart) return 0;
  if (asOf >= task.plannedEnd) return 100;

  const duration = Math.max(
    1,
    differenceInCalendarDays(task.plannedEnd, task.plannedStart) + 1,
  );
  const elapsed = differenceInCalendarDays(asOf, task.plannedStart) + 1;
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
}

export function calculateWeightedProgress(tasks: OpcTask[], asOf: string) {
  if (tasks.length === 0) {
    return { plannedPercent: null, actualPercent: null, variancePoints: null };
  }

  const totalWeight = tasks.reduce(
    (sum, task) => sum + Math.max(0, task.weight),
    0,
  );
  if (totalWeight === 0) {
    return { plannedPercent: null, actualPercent: null, variancePoints: null };
  }

  const plannedPercent =
    tasks.reduce(
      (sum, task) =>
        sum + resolvePlannedProgress(task, asOf) * Math.max(0, task.weight),
      0,
    ) / totalWeight;
  const actualPercent =
    tasks.reduce(
      (sum, task) => sum + resolveTaskProgress(task) * Math.max(0, task.weight),
      0,
    ) / totalWeight;

  return {
    plannedPercent,
    actualPercent,
    variancePoints: actualPercent - plannedPercent,
  };
}

export function buildProgressCurve(input: {
  tasks: OpcTask[];
  startsOn: string;
  endsOn: string;
  sampleEveryDays?: number;
}) {
  const duration = differenceInCalendarDays(input.endsOn, input.startsOn);
  const step = Math.max(1, input.sampleEveryDays ?? 7);
  const samples = [];

  for (let offset = 0; offset <= duration; offset += step) {
    const date = addCalendarDays(input.startsOn, offset);
    samples.push({ date, ...calculateWeightedProgress(input.tasks, date) });
  }

  if (samples.at(-1)?.date !== input.endsOn) {
    samples.push({
      date: input.endsOn,
      ...calculateWeightedProgress(input.tasks, input.endsOn),
    });
  }

  return samples;
}
