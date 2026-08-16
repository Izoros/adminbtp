import { calculateCriticalPath } from "@/modules/opc/domain/cpm";
import { simulateDelayImpact } from "@/modules/opc/domain/coordination";
import type { OpcDependency, OpcTask } from "@/modules/opc/domain/types";

export function simulateTaskDelay(input: {
  projectStart: string;
  tasks: OpcTask[];
  dependencies: OpcDependency[];
  taskId: string;
  delayDays: number;
}) {
  const baseline = calculateCriticalPath(input);
  const delayedTasks = input.tasks.map((task) =>
    task.id === input.taskId
      ? {
          ...task,
          durationDays: task.durationDays + Math.max(0, input.delayDays),
        }
      : task,
  );
  const recalculated = calculateCriticalPath({
    projectStart: input.projectStart,
    tasks: delayedTasks,
    dependencies: input.dependencies,
  });

  return {
    baseline,
    recalculated,
    impact: simulateDelayImpact({
      taskId: input.taskId,
      delayDays: Math.max(0, input.delayDays),
      tasks: delayedTasks,
      dependencies: input.dependencies,
      baseline,
      recalculated,
    }),
  };
}
