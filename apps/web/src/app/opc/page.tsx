import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAuthenticatedUser, createClient } from "@/lib/supabase/server";
import { buildLoginRedirectPath } from "@/modules/auth/services/session-navigation";
import { OpcWorkspace } from "@/modules/opc/components/opc-workspace";
import type { OpcWorkspaceView } from "@/modules/opc/components/opc-workspace";
import {
  createOpcActionAction,
  createOpcBaselineAction,
  createOpcDependencyAction,
  createOpcMeetingAction,
  createOpcReceptionAction,
  createOpcReservationAction,
  declareOpcDelayAction,
  recordOpcProgressAction,
  saveOpcTaskAction,
} from "@/modules/opc/services/opc-actions";
import { loadOpcModuleData } from "@/modules/opc/services/opc-data";

const supportedViews = new Set([
  "cockpit",
  "planning",
  "lookahead",
  "milestones",
  "companies",
  "zones",
  "meetings",
  "actions",
  "delays",
  "progress",
  "reception",
  "reports",
  "history",
]);

function isSupportedView(value: string): value is OpcWorkspaceView {
  return supportedViews.has(value);
}

type OpcPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function todayInMayotte(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Mayotte",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function OpcPage({ searchParams }: OpcPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect(buildLoginRedirectPath("/opc"));

  const params = (await searchParams) ?? {};
  const projectId = first(params.projectId);
  const requestedView = first(params.view) ?? "cockpit";
  const view = isSupportedView(requestedView) ? requestedView : "cockpit";
  const supabase = await createClient();
  const data = await loadOpcModuleData(supabase, projectId);

  return (
    <AppShell eyebrow="Espace metier OPC" title="Coordination chantier">
      <div className="mx-auto max-w-[1560px]">
        <OpcWorkspace
          data={data}
          view={view}
          feedback={first(params.result)}
          asOf={todayInMayotte()}
          actions={{
            saveTask: saveOpcTaskAction,
            createDependency: createOpcDependencyAction,
            recordProgress: recordOpcProgressAction,
            createBaseline: createOpcBaselineAction,
            createAction: createOpcActionAction,
            createMeeting: createOpcMeetingAction,
            declareDelay: declareOpcDelayAction,
            createReception: createOpcReceptionAction,
            createReservation: createOpcReservationAction,
          }}
        />
      </div>
    </AppShell>
  );
}
