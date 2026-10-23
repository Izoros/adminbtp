import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  GENERAL_SECTION_LABEL,
  agendaItemLabel,
  formatIsoDateFr,
  groupDecisionsByLot,
  meetingTitle,
  renderMeetingReportPdf,
  sanitizeForCharset,
  wrapText,
} from "./meeting-report";

describe("groupDecisionsByLot", () => {
  it("puts decisions without a lot first, then lots in order of appearance", () => {
    const groups = groupDecisionsByLot([
      { text: "a", lotLabel: "Lot 02", taskCreated: true },
      { text: "b", taskCreated: false },
      { text: "c", lotLabel: "Lot 01", taskCreated: true },
      { text: "d", lotLabel: "Lot 02", taskCreated: false },
    ]);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.text)])).toEqual([
      [GENERAL_SECTION_LABEL, ["b"]],
      ["Lot 02", ["a", "d"]],
      ["Lot 01", ["c"]],
    ]);
  });

  it("omits the general section when every decision has a lot", () => {
    expect(groupDecisionsByLot([{ text: "a", lotLabel: "Lot 01", taskCreated: false }]).map((g) => g.label)).toEqual([
      "Lot 01",
    ]);
  });
});

describe("agendaItemLabel", () => {
  it("uses the free text alone when there is no reference", () => {
    expect(agendaItemLabel({ text: "Planning des menuiseries" })).toBe("Planning des menuiseries");
  });

  it("describes references and appends them to the text", () => {
    expect(
      agendaItemLabel({
        text: "Infiltrations",
        logEntry: { date: "2026-10-20", description: "Pluie, arrêt façade" },
        documentTitle: "Plan EXE toiture",
      }),
    ).toBe("Infiltrations (Document : Plan EXE toiture · Journal du 20/10/2026 : Pluie, arrêt façade)");
  });

  it("flags references the reader cannot resolve instead of dropping them", () => {
    expect(agendaItemLabel({ taskTitle: null })).toBe("Tâche : introuvable");
  });
});

describe("meetingTitle", () => {
  it("includes the kind, number and date", () => {
    expect(
      meetingTitle({ kindLabel: "Réunion de chantier (OPC)", number: 4, date: "2026-10-22", status: "VALIDE" }),
    ).toBe("Réunion de chantier (OPC) n°4 du 22/10/2026");
  });
});

describe("formatIsoDateFr", () => {
  it("formats an ISO date as dd/mm/yyyy", () => {
    expect(formatIsoDateFr("2026-10-22")).toBe("22/10/2026");
  });
});

describe("sanitizeForCharset", () => {
  it("keeps supported characters and replaces the others", () => {
    const supported = new Set([..."Réunion ok"].map((c) => c.codePointAt(0)!));
    expect(sanitizeForCharset("Réunion 🚧 ok", supported)).toBe("Réunion ? ok");
  });
});

describe("wrapText", () => {
  const measure = (s: string) => s.length;

  it("wraps on word boundaries", () => {
    expect(wrapText("un deux trois quatre", 9, measure)).toEqual(["un deux", "trois", "quatre"]);
  });

  it("splits a word longer than the line", () => {
    expect(wrapText("abcdefghij", 4, measure)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("keeps explicit line breaks", () => {
    expect(wrapText("a\nb", 10, measure)).toEqual(["a", "b"]);
  });
});

describe("renderMeetingReportPdf", () => {
  it("produces a valid PDF that paginates long reports and tolerates unsupported characters", async () => {
    const bytes = await renderMeetingReportPdf({
      site: { name: "Résidence Les Badamiers", reference: "CH-2026-001", address: "Rue du Port", city: "Dzaoudzi" },
      meeting: {
        kindLabel: "Réunion de chantier (OPC)",
        number: 4,
        date: "2026-10-22",
        status: "VALIDE",
        validatedAt: "2026-10-22T15:00:00Z",
        validatedByName: "Léa Martin",
      },
      attendees: [
        { name: "Ahmed Saïd", organizationName: "MAWU", status: "PRESENT" },
        { name: "Léa Martin", status: "EXCUSE" },
      ],
      agenda: ["Planning 🗓️ des menuiseries", "Infiltrations (Journal du 20/10/2026 : pluie)"],
      decisions: Array.from({ length: 80 }, (_, i) => ({
        text: `Décision n°${i + 1} — reprise de l'étanchéité ✅ ${"texte long ".repeat(10)}`,
        lotLabel: i % 2 ? "Lot 02 — Gros œuvre" : undefined,
        taskCreated: i % 3 === 0,
      })),
      generatedAt: new Date("2026-10-23T08:00:00Z"),
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(doc.getTitle()).toBe("Réunion de chantier (OPC) n°4 du 22/10/2026 — Résidence Les Badamiers");
  });
});
