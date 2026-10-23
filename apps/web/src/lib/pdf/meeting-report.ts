import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Export PDF d'un compte-rendu de réunion de chantier, généré à la volée à partir des lignes
 * `meeting_notes` / `meeting_attendees` / `meeting_agenda_items` / `meeting_decisions` (jamais
 * l'inverse) — rien n'est
 * stocké : le fichier est reconstruit à chaque téléchargement.
 */
export interface MeetingReportInput {
  site: { name: string; reference: string; address: string; city: string; postalCode?: string };
  meeting: {
    kindLabel: string;
    number?: number;
    date: string;
    status: "BROUILLON" | "VALIDE";
    authorOrganizationName?: string;
    validatedAt?: string;
    validatedByName?: string;
  };
  attendees: { name: string; organizationName?: string; status: AttendeeStatus }[];
  agenda: string[];
  decisions: { text: string; lotLabel?: string; taskCreated: boolean }[];
  generatedAt: Date;
}

type AttendeeStatus = "PRESENT" | "EXCUSE" | "ABSENT";

const ATTENDANCE_SECTIONS: { status: AttendeeStatus; label: string }[] = [
  { status: "PRESENT", label: "Présents" },
  { status: "EXCUSE", label: "Excusés" },
  { status: "ABSENT", label: "Absents" },
];

export const GENERAL_SECTION_LABEL = "Points généraux";

/** Regroupe les décisions par lot, les décisions sans lot en tête, lots dans l'ordre d'apparition. */
export function groupDecisionsByLot(
  decisions: MeetingReportInput["decisions"],
): { label: string; items: MeetingReportInput["decisions"] }[] {
  const groups = new Map<string, MeetingReportInput["decisions"]>();
  groups.set(GENERAL_SECTION_LABEL, []);
  for (const d of decisions) {
    const label = d.lotLabel ?? GENERAL_SECTION_LABEL;
    const items = groups.get(label) ?? [];
    items.push(d);
    groups.set(label, items);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

/** Titre du CR : "Réunion de chantier (OPC) n°4 du 22/10/2026". */
export function meetingTitle(meeting: MeetingReportInput["meeting"]): string {
  return `${meeting.kindLabel}${meeting.number ? ` n°${meeting.number}` : ""} du ${formatIsoDateFr(meeting.date)}`;
}

/**
 * Libellé d'un point d'ordre du jour : texte libre, référence (tâche, document, journal) ou les
 * deux. Une référence illisible (supprimée ou hors RLS) reste signalée plutôt qu'omise.
 */
export function agendaItemLabel(item: {
  text?: string;
  taskTitle?: string | null;
  documentTitle?: string | null;
  logEntry?: { date: string; description: string } | null;
}): string {
  const refs: string[] = [];
  if (item.taskTitle !== undefined) refs.push(`Tâche : ${item.taskTitle ?? "introuvable"}`);
  if (item.documentTitle !== undefined) refs.push(`Document : ${item.documentTitle ?? "introuvable"}`);
  if (item.logEntry !== undefined) {
    refs.push(
      item.logEntry
        ? `Journal du ${formatIsoDateFr(item.logEntry.date)} : ${item.logEntry.description}`
        : "Journal : entrée introuvable",
    );
  }
  if (!item.text) return refs.join(" · ") || "Point sans libellé";
  return refs.length ? `${item.text} (${refs.join(" · ")})` : item.text;
}

/** "2026-10-22" → "22/10/2026", sans passer par `Date` pour éviter tout décalage de fuseau. */
export function formatIsoDateFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * Remplace les caractères que la police standard (WinAnsi) ne sait pas encoder, pour que
 * pdf-lib ne lève pas d'erreur sur une saisie libre (emoji, guillemets exotiques...).
 */
export function sanitizeForCharset(text: string, supported: ReadonlySet<number>): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const cp = ch.codePointAt(0)!;
    if (supported.has(cp)) out += ch;
    else if (ch === "\t") out += " ";
    else if (ch === "‑" || ch === "‐") out += "-";
    else out += "?";
  }
  return out;
}

/** Découpe un texte en lignes tenant dans `maxWidth`, en coupant un mot trop long si besoin. */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      current = "";
      let rest = word;
      while (measure(rest) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      current = rest;
    }
    lines.push(current);
  }
  return lines;
}

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const INK = rgb(0.13, 0.15, 0.18);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.82, 0.84, 0.87);
const DRAFT = rgb(0.72, 0.4, 0.05);
const VALIDATED = rgb(0.1, 0.5, 0.3);

class Writer {
  page: PDFPage;
  y: number;

  constructor(
    private readonly doc: PDFDocument,
    private readonly fonts: { regular: PDFFont; bold: PDFFont },
    private readonly charset: ReadonlySet<number>,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN + 20) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  text(
    raw: string,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; prefix?: string } = {},
  ) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const indent = opts.indent ?? 0;
    const lineHeight = size * 1.35;
    const prefix = opts.prefix ?? "";
    const prefixWidth = prefix ? font.widthOfTextAtSize(prefix, size) : 0;
    const lines = wrapText(sanitizeForCharset(raw, this.charset), CONTENT_WIDTH - indent - prefixWidth, (s) =>
      font.widthOfTextAtSize(s, size),
    );
    lines.forEach((line, i) => {
      this.ensureSpace(lineHeight);
      this.y -= lineHeight;
      if (i === 0 && prefix) {
        this.page.drawText(prefix, { x: MARGIN + indent, y: this.y, size, font, color: opts.color ?? INK });
      }
      this.page.drawText(line, {
        x: MARGIN + indent + prefixWidth,
        y: this.y,
        size,
        font,
        color: opts.color ?? INK,
      });
    });
  }

  gap(h: number) {
    this.y -= h;
  }

  rule() {
    this.ensureSpace(10);
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.5,
      color: RULE,
    });
    this.y -= 4;
  }

  heading(label: string) {
    this.ensureSpace(40);
    this.gap(10);
    this.text(label, { size: 12, bold: true });
    this.rule();
  }
}

export async function renderMeetingReportPdf(input: MeetingReportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const charset = new Set(regular.getCharacterSet());
  const meetingDateFr = formatIsoDateFr(input.meeting.date);
  const isDraft = input.meeting.status === "BROUILLON";

  doc.setTitle(`${meetingTitle(input.meeting)} — ${input.site.name}`);
  doc.setSubject("Compte-rendu de réunion de chantier");
  doc.setProducer("AdminBTP");
  doc.setCreator("AdminBTP");
  doc.setCreationDate(input.generatedAt);

  const w = new Writer(doc, { regular, bold }, charset);

  w.text("COMPTE-RENDU DE RÉUNION DE CHANTIER", { size: 9, bold: true, color: MUTED });
  w.gap(4);
  w.text(input.site.name, { size: 18, bold: true });
  w.text(`Réf. ${input.site.reference}`, { size: 10, color: MUTED });
  w.text(
    [input.site.address, [input.site.postalCode, input.site.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", "),
    { size: 10, color: MUTED },
  );
  w.gap(6);
  w.text(meetingTitle(input.meeting), { size: 12, bold: true });
  if (input.meeting.authorOrganizationName) {
    w.text(`Rédigé par ${input.meeting.authorOrganizationName}`, { size: 10, color: MUTED });
  }
  if (isDraft) {
    w.text("BROUILLON — compte-rendu non validé, susceptible d'être modifié", { size: 10, bold: true, color: DRAFT });
  } else {
    const validatedOn = input.meeting.validatedAt
      ? ` le ${new Date(input.meeting.validatedAt).toLocaleDateString("fr-FR")}`
      : "";
    const validatedBy = input.meeting.validatedByName ? ` par ${input.meeting.validatedByName}` : "";
    w.text(`Validé${validatedOn}${validatedBy}`, { size: 10, bold: true, color: VALIDATED });
  }
  w.rule();

  w.heading("Participants");
  if (input.attendees.length === 0) {
    w.text("Aucun participant enregistré.", { color: MUTED });
  } else {
    for (const section of ATTENDANCE_SECTIONS) {
      const people = input.attendees.filter((a) => a.status === section.status);
      if (people.length === 0) continue;
      w.gap(4);
      w.text(`${section.label} (${people.length})`, { bold: true });
      for (const a of people) {
        w.text(a.organizationName ? `${a.name} (${a.organizationName})` : a.name, { prefix: "•  ", indent: 8 });
      }
    }
  }

  w.heading(`Ordre du jour (${input.agenda.length})`);
  if (input.agenda.length === 0) {
    w.text("Aucun point d'ordre du jour.", { color: MUTED });
  } else {
    input.agenda.forEach((item, i) => w.text(item, { prefix: `${i + 1}.  ` }));
  }

  w.heading(`Décisions (${input.decisions.length})`);
  if (input.decisions.length === 0) {
    w.text("Aucune décision enregistrée.", { color: MUTED });
  } else {
    for (const group of groupDecisionsByLot(input.decisions)) {
      w.gap(4);
      w.text(group.label, { bold: true });
      group.items.forEach((d, i) => {
        w.text(d.taskCreated ? `${d.text} [tâche créée]` : d.text, { prefix: `${i + 1}.  `, indent: 8 });
      });
    }
  }

  const pages = doc.getPages();
  const footer = sanitizeForCharset(
    `${isDraft ? "BROUILLON — " : ""}Compte-rendu du ${meetingDateFr} — généré par AdminBTP le ${input.generatedAt.toLocaleDateString("fr-FR")}`,
    charset,
  );
  pages.forEach((page, i) => {
    const size = 8;
    page.drawText(footer, { x: MARGIN, y: MARGIN - 20, size, font: regular, color: MUTED });
    const pageLabel = `${i + 1} / ${pages.length}`;
    page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageLabel, size),
      y: MARGIN - 20,
      size,
      font: regular,
      color: MUTED,
    });
  });

  return doc.save();
}
