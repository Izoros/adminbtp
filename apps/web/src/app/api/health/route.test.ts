import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("health-route", () => {
  it("retourne un etat sain exploitable par le monitoring", async () => {
    const response = await GET();
    const payload = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("adminbtp-web");
    expect(typeof payload.timestamp).toBe("string");
  });
});
