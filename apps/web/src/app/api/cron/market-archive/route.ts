import type { NextRequest } from "next/server";

import { runMarketArchiveBackup } from "@/modules/archival/services/market-archive";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorizationHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return false;
  }

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const result = await runMarketArchiveBackup();
    return Response.json(result, {
      status: result.ok ? 200 : 500,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "market_archive_failed",
      },
      { status: 500 },
    );
  }
}
