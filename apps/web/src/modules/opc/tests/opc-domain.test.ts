import { calculateCriticalPath } from "@/modules/opc/domain/cpm";
import {
  buildLookahead,
  calculateCockpit,
  detectZoneConflicts,
} from "@/modules/opc/domain/coordination";
import {
  OpcDependencyError,
  topologicalSort,
  wouldCreateCycle,
} from "@/modules/opc/domain/dependency-graph";
import { canOpc } from "@/modules/opc/domain/permissions";
import {
  comparePlanningSnapshots,
  createPlanningSnapshot,
} from "@/modules/opc/domain/planning-versions";
import { calculateWeightedProgress } from "@/modules/opc/domain/progress";
import { simulateTaskDelay } from "@/modules/opc/domain/scenarios";
import {
  fortyEightHomesDependencies,
  fortyEightHomesTasks,
} from "@/modules/opc/fixtures/forty-eight-homes";
import type { OpcDependency, OpcTask } from "@/modules/opc/domain/types";

describe("moteur OPC", () => {
  it("ordonne le reseau et refuse un cycle", () => {
    const ids = fortyEightHomesTasks.map((task) => task.id);
    const order = topologicalSort(ids, fortyEightHomesDependencies);
    expect(order.indexOf("t01")).toBeLessThan(order.indexOf("m02"));
    expect(
      wouldCreateCycle(ids, fortyEightHomesDependencies, {
        id: "cycle",
        predecessorId: "m02",
        successorId: "t01",
        type: "FS",
        lagDays: 0,
      }),
    ).toBe(true);
  });

  it("signale les references de tache invalides", () => {
    expect(() =>
      topologicalSort(
        ["a"],
        [
          {
            id: "invalid",
            predecessorId: "a",
            successorId: "missing",
            type: "FS",
            lagDays: 0,
          },
        ],
      ),
    ).toThrow(OpcDependencyError);
  });

  it("calcule chemin critique, marges et jalons avec FS et SS", () => {
    const schedule = calculateCriticalPath({
      projectStart: "2026-09-01",
      tasks: fortyEightHomesTasks,
      dependencies: fortyEightHomesDependencies,
    });
    const installation = schedule.find((item) => item.taskId === "t01");
    const reception = schedule.find((item) => item.taskId === "m02");

    expect(schedule).toHaveLength(fortyEightHomesTasks.length);
    expect(installation?.isCritical).toBe(true);
    expect(reception?.isCritical).toBe(true);
    expect(reception?.calculatedEnd).toMatch(/^2027-/);
  });

  it("applique aussi les contraintes FF et SF avec decalage", () => {
    const first = { ...fortyEightHomesTasks[0]!, id: "a", durationDays: 5 };
    const second = { ...fortyEightHomesTasks[1]!, id: "b", durationDays: 3 };
    const ff = calculateCriticalPath({
      projectStart: "2026-09-01",
      tasks: [first, second],
      dependencies: [
        {
          id: "ff",
          predecessorId: "a",
          successorId: "b",
          type: "FF",
          lagDays: 2,
        },
      ],
    });
    const sf = calculateCriticalPath({
      projectStart: "2026-09-01",
      tasks: [first, second],
      dependencies: [
        {
          id: "sf",
          predecessorId: "a",
          successorId: "b",
          type: "SF",
          lagDays: 6,
        },
      ],
    });

    expect(ff.find((item) => item.taskId === "b")?.earliestStartOffset).toBe(4);
    expect(sf.find((item) => item.taskId === "b")?.earliestStartOffset).toBe(3);
  });

  it("calcule un reseau lineaire de 5 000 taches sans recursion", () => {
    const seed = fortyEightHomesTasks[0]!;
    const tasks: OpcTask[] = Array.from({ length: 5_000 }, (_, index) => ({
      ...seed,
      id: `large-${index}`,
      code: `L${index}`,
      durationDays: 1,
      progressPercent: 0,
      status: "not_started",
      zoneIds: [],
    }));
    const dependencies: OpcDependency[] = Array.from(
      { length: tasks.length - 1 },
      (_, index) => ({
        id: `large-dependency-${index}`,
        predecessorId: tasks[index]!.id,
        successorId: tasks[index + 1]!.id,
        type: "FS",
        lagDays: 0,
      }),
    );
    const schedule = calculateCriticalPath({
      projectStart: "2026-09-01",
      tasks,
      dependencies,
    });

    expect(schedule).toHaveLength(5_000);
    expect(schedule.at(-1)?.earliestFinishOffset).toBe(5_000);
  });

  it("calcule l'avancement pondere sans inventer de resultat", () => {
    const progress = calculateWeightedProgress(
      fortyEightHomesTasks,
      "2026-09-14",
    );
    expect(progress.plannedPercent).not.toBeNull();
    expect(progress.actualPercent).toBeGreaterThan(0);
    expect(calculateWeightedProgress([], "2026-09-14")).toEqual({
      plannedPercent: null,
      actualPercent: null,
      variancePoints: null,
    });
  });

  it("produit un lookahead 3 semaines et detecte les conflits de zone", () => {
    const lookahead = buildLookahead(fortyEightHomesTasks, "2027-01-01", 3);
    const schedule = calculateCriticalPath({
      projectStart: "2026-09-01",
      tasks: fortyEightHomesTasks,
      dependencies: fortyEightHomesDependencies,
    });
    const conflicts = detectZoneConflicts(fortyEightHomesTasks, schedule);

    expect(lookahead.map((task) => task.id)).toContain("t08");
    expect(conflicts.some((conflict) => conflict.zoneId === "zone-a")).toBe(
      true,
    );
  });

  it("simule un retard et mesure sa propagation", () => {
    const result = simulateTaskDelay({
      projectStart: "2026-09-01",
      tasks: fortyEightHomesTasks,
      dependencies: fortyEightHomesDependencies,
      taskId: "t07",
      delayDays: 10,
    });

    expect(result.impact.netProjectDelayDays).toBe(10);
    expect(result.impact.impactedMilestoneIds).toContain("m02");
  });

  it("conserve une baseline immuable et compare les ecarts", () => {
    const baseline = createPlanningSnapshot({
      id: "baseline-1",
      name: "Planning marche",
      createdAt: "2026-08-16T08:00:00Z",
      tasks: fortyEightHomesTasks,
      dependencies: fortyEightHomesDependencies,
    });
    const comparison = comparePlanningSnapshots(
      baseline,
      fortyEightHomesTasks.map((task) =>
        task.id === "t03"
          ? { ...task, durationDays: task.durationDays + 5 }
          : task,
      ),
    );

    expect(Object.isFrozen(baseline)).toBe(true);
    expect(comparison.find((item) => item.taskId === "t03")?.change).toBe(
      "modified",
    );
  });

  it("applique les droits par role OPC", () => {
    expect(canOpc("administrator", "member.manage")).toBe(true);
    expect(canOpc("collaborator", "planning.write")).toBe(true);
    expect(canOpc("company_contributor", "baseline.create")).toBe(false);
    expect(canOpc("viewer", "planning.write")).toBe(false);
  });

  it("retourne Donnees insuffisantes pour un cockpit vide", () => {
    expect(
      calculateCockpit({
        tasks: [],
        schedule: [],
        actions: [],
        prerequisites: [],
        delays: [],
        reservations: [],
        asOf: "2026-08-16",
      }),
    ).toEqual({ sufficientData: false, reason: "Données insuffisantes" });
  });
});
