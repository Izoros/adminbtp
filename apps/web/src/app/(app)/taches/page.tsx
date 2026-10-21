import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { mockTasks, mockSites, USERS } from "@/lib/mock-data";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, type TaskStatus, type TaskPriority } from "@adminbtp/types";

const COLUMNS: TaskStatus[] = ["A_FAIRE", "EN_COURS", "EN_ATTENTE", "FAIT"];

const PRIORITY_TONE: Record<TaskPriority, "neutral" | "info" | "warning" | "danger"> = {
  BASSE: "neutral",
  NORMALE: "info",
  HAUTE: "warning",
  CRITIQUE: "danger",
};

export default function TachesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tâches" description={`${mockTasks.length} tâches — issues des mails, phases, validations et actions manuelles`} />

      {mockTasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Aucune tâche" />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {COLUMNS.map((status) => {
            const tasks = mockTasks.filter((t) => t.status === status);
            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle>{TASK_STATUS_LABELS[status]} ({tasks.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-graphite-500">Aucune tâche.</p>
                  ) : (
                    tasks.map((task) => {
                      const site = mockSites.find((s) => s.id === task.siteId);
                      const assignee = USERS.find((u) => u.id === task.assignedUserId);
                      return (
                        <div key={task.id} className="rounded-md border border-surface-border p-2.5 text-sm">
                          <p className="font-medium text-graphite-900">{task.title}</p>
                          {site && <p className="text-xs text-graphite-500">{site.name}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <Badge tone={PRIORITY_TONE[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
                            {assignee && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-night-800 text-[10px] font-semibold text-white">
                                {assignee.initials}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
