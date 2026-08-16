import type { OpcDependency, OpcTask } from "@/modules/opc/domain/types";

export type OpcPlanningSnapshot = Readonly<{
  id: string;
  name: string;
  createdAt: string;
  tasks: ReadonlyArray<Readonly<OpcTask>>;
  dependencies: ReadonlyArray<Readonly<OpcDependency>>;
}>;

export function createPlanningSnapshot(input: {
  id: string;
  name: string;
  createdAt: string;
  tasks: OpcTask[];
  dependencies: OpcDependency[];
}): OpcPlanningSnapshot {
  return Object.freeze({
    id: input.id,
    name: input.name,
    createdAt: input.createdAt,
    tasks: Object.freeze(
      input.tasks.map((task) =>
        Object.freeze({ ...task, zoneIds: Object.freeze([...task.zoneIds]) }),
      ),
    ) as ReadonlyArray<Readonly<OpcTask>>,
    dependencies: Object.freeze(
      input.dependencies.map((dependency) => Object.freeze({ ...dependency })),
    ),
  });
}

export function comparePlanningSnapshots(
  reference: OpcPlanningSnapshot,
  currentTasks: OpcTask[],
) {
  const referenceById = new Map(reference.tasks.map((task) => [task.id, task]));
  const currentById = new Map(currentTasks.map((task) => [task.id, task]));
  const allTaskIds = new Set([...referenceById.keys(), ...currentById.keys()]);

  return Array.from(allTaskIds, (taskId) => {
    const before = referenceById.get(taskId);
    const after = currentById.get(taskId);

    if (!before) return { taskId, change: "added" as const };
    if (!after) return { taskId, change: "removed" as const };

    const changedFields = (
      [
        "name",
        "plannedStart",
        "plannedEnd",
        "durationDays",
        "lotId",
        "companyId",
        "status",
      ] as const
    ).filter((field) => before[field] !== after[field]);

    return {
      taskId,
      change:
        changedFields.length > 0
          ? ("modified" as const)
          : ("unchanged" as const),
      changedFields,
    };
  });
}
