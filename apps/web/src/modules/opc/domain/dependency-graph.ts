import type { OpcDependency } from "@/modules/opc/domain/types";

export class OpcDependencyError extends Error {
  constructor(
    public readonly code: "missing_task" | "self_dependency" | "cycle",
    message: string,
  ) {
    super(message);
    this.name = "OpcDependencyError";
  }
}

export function topologicalSort(
  taskIds: string[],
  dependencies: OpcDependency[],
): string[] {
  const knownTaskIds = new Set(taskIds);
  const inDegree = new Map(taskIds.map((taskId) => [taskId, 0]));
  const successors = new Map(taskIds.map((taskId) => [taskId, [] as string[]]));

  for (const dependency of dependencies) {
    if (
      !knownTaskIds.has(dependency.predecessorId) ||
      !knownTaskIds.has(dependency.successorId)
    ) {
      throw new OpcDependencyError(
        "missing_task",
        `La dependance ${dependency.id} pointe vers une tache absente.`,
      );
    }

    if (dependency.predecessorId === dependency.successorId) {
      throw new OpcDependencyError(
        "self_dependency",
        "Une tache ne peut pas dependre d'elle-meme.",
      );
    }

    successors.get(dependency.predecessorId)?.push(dependency.successorId);
    inDegree.set(
      dependency.successorId,
      (inDegree.get(dependency.successorId) ?? 0) + 1,
    );
  }

  const queue = taskIds.filter((taskId) => inDegree.get(taskId) === 0);
  const order: string[] = [];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const taskId = queue[queueIndex]!;
    queueIndex += 1;
    order.push(taskId);

    for (const successorId of successors.get(taskId) ?? []) {
      const nextDegree = (inDegree.get(successorId) ?? 0) - 1;
      inDegree.set(successorId, nextDegree);
      if (nextDegree === 0) queue.push(successorId);
    }
  }

  if (order.length !== taskIds.length) {
    throw new OpcDependencyError(
      "cycle",
      "Le reseau contient un cycle. La dependance a ete refusee.",
    );
  }

  return order;
}

export function wouldCreateCycle(
  taskIds: string[],
  dependencies: OpcDependency[],
  candidate: OpcDependency,
): boolean {
  try {
    topologicalSort(taskIds, [...dependencies, candidate]);
    return false;
  } catch (error) {
    return error instanceof OpcDependencyError && error.code === "cycle";
  }
}
