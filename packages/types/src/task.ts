import { z } from "zod";

export const TaskStatus = z.enum(["A_FAIRE", "EN_COURS", "EN_ATTENTE", "FAIT", "ANNULE"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(["BASSE", "NORMALE", "HAUTE", "CRITIQUE"]);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  FAIT: "Fait",
  ANNULE: "Annulé",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
};

export const Task = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatus,
  priority: TaskPriority,
  assignedUserId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
  sourceType: z.enum(["MANUEL", "MAIL", "PHASE", "VALIDATION", "AUTOMATISATION", "MEETING"]).default("MANUEL"),
  sourceId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
export type Task = z.infer<typeof Task>;
