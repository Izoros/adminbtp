import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { calculateCriticalPath } from "@/modules/opc/domain/cpm";
import { calculateCockpit } from "@/modules/opc/domain/coordination";
import { calculateWeightedProgress } from "@/modules/opc/domain/progress";
import { parseOpcWorkspace } from "@/modules/opc/services/opc-data";
import { createOpcXlsx } from "@/modules/opc/services/opc-xlsx";

export const runtime = "nodejs";

function safeFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function todayInMayotte(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Mayotte",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
  const format = request.nextUrl.searchParams.get("format");
  if (!projectId || (format !== "pdf" && format !== "xlsx")) {
    return new Response("Parametres d'export invalides.", { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return new Response("Supabase indisponible.", { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Authentification requise.", { status: 401 });

  const { data, error } = await supabase.rpc("get_opc_workspace", {
    target_project_id: projectId,
  });
  if (error)
    return new Response("Acces OPC refuse ou chantier indisponible.", {
      status: 403,
    });

  const workspace = parseOpcWorkspace(data);
  if (!workspace)
    return new Response("Snapshot OPC invalide.", { status: 500 });

  const schedule = workspace.project.startsOn
    ? calculateCriticalPath({
        projectStart: workspace.project.startsOn,
        tasks: workspace.tasks,
        dependencies: workspace.dependencies,
      })
    : [];
  const scheduleByTask = new Map(schedule.map((item) => [item.taskId, item]));
  const filename = `opc-${safeFilename(workspace.project.code || workspace.project.name)}`;

  if (format === "xlsx") {
    const rows: Array<Array<string | number | boolean | null>> = [
      [
        "Code",
        "Tache",
        "Statut",
        "Debut previsionnel",
        "Fin previsionnelle",
        "Debut courant",
        "Fin courante",
        "Avancement %",
        "Duree j",
        "Marge totale j",
        "Marge libre j",
        "Critique",
        "Jalon contractuel",
      ],
      ...workspace.tasks.map((task) => {
        const item = scheduleByTask.get(task.id);
        return [
          task.code,
          task.name,
          task.status,
          task.plannedStart,
          task.plannedEnd,
          task.currentStart ?? "",
          task.currentEnd ?? "",
          task.progressPercent,
          task.durationDays,
          item?.totalFloatDays ?? null,
          item?.freeFloatDays ?? null,
          item?.isCritical ?? false,
          task.isContractualMilestone,
        ];
      }),
    ];
    const bytes = await createOpcXlsx(rows);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const asOf = todayInMayotte();
  const cockpit = calculateCockpit({
    tasks: workspace.tasks,
    schedule,
    actions: workspace.actions,
    prerequisites: workspace.prerequisites,
    delays: workspace.delays,
    reservations: workspace.reservations,
    asOf,
  });
  const progress = calculateWeightedProgress(workspace.tasks, asOf);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 792;

  const line = (
    text: string,
    options?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> },
  ) => {
    const size = options?.size ?? 10;
    if (y < 54) {
      page = pdf.addPage([595, 842]);
      y = 792;
    }
    page.drawText(text.slice(0, 105), {
      x: 46,
      y,
      size,
      font: options?.bold ? bold : font,
      color: options?.color ?? rgb(0.18, 0.16, 0.15),
    });
    y -= size + 7;
  };

  line("ADMINBTP - RAPPORT OPC", { bold: true, size: 18 });
  line(`${workspace.project.code} - ${workspace.project.name}`, {
    bold: true,
    size: 13,
  });
  line(`Date de situation : ${asOf}`);
  y -= 8;

  if (!cockpit.sufficientData) {
    line("Donnees insuffisantes : aucune tache OPC exploitable.", {
      bold: true,
      color: rgb(0.75, 0.2, 0.18),
    });
  } else {
    line("SYNTHESE CALCULEE", { bold: true, size: 12 });
    line(
      `Taches : ${cockpit.taskCount} | critiques : ${cockpit.criticalTaskCount} | en retard : ${cockpit.lateTaskCount}`,
    );
    line(
      `Retard cumule : ${cockpit.cumulativeDelayDays} j | actions echues : ${cockpit.overdueActionCount}`,
    );
    line(
      `Avancement planifie : ${progress.plannedPercent?.toFixed(1) ?? "non calculable"} %`,
    );
    line(
      `Avancement reel : ${progress.actualPercent?.toFixed(1) ?? "non calculable"} %`,
    );
    y -= 8;
  }

  line("PLANNING", { bold: true, size: 12 });
  for (const task of workspace.tasks) {
    const item = scheduleByTask.get(task.id);
    line(
      `${task.code} | ${task.name} | ${task.plannedStart} -> ${task.plannedEnd} | ${task.progressPercent}% | marge ${item?.totalFloatDays ?? "-"} j${item?.isCritical ? " | CRITIQUE" : ""}`,
      { size: 8 },
    );
  }

  const bytes = await pdf.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
