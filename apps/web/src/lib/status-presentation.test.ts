import { describe, expect, it } from "vitest";
import { toneForSiteStatus } from "@adminbtp/ui";

describe("toneForSiteStatus", () => {
  it("maps EN_COURS to info", () => {
    expect(toneForSiteStatus("EN_COURS")).toBe("info");
  });

  it("maps RECEPTION and GPA to warning", () => {
    expect(toneForSiteStatus("RECEPTION")).toBe("warning");
    expect(toneForSiteStatus("GPA")).toBe("warning");
  });

  it("maps CLOTURE to success", () => {
    expect(toneForSiteStatus("CLOTURE")).toBe("success");
  });

  it("maps SUSPENDU to danger", () => {
    expect(toneForSiteStatus("SUSPENDU")).toBe("danger");
  });

  it("falls back to neutral for unknown statuses", () => {
    expect(toneForSiteStatus("INCONNU")).toBe("neutral");
  });
});
