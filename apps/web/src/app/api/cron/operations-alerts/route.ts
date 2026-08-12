import type { NextRequest } from "next/server";

import { runOperationsAlertScan } from "@/modules/archival/services/operations-alerts";

export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(
    cronSecret &&
      request.headers.get("authorization") === `Bearer ${cronSecret}`,
  );
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOperationsAlertScan();
    return Response.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "operations_alert_scan_failed",
      },
      { status: 500 },
    );
  }
}
