import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sanitizeForCharset, wrapText } from "./meeting-report";

/**
 * Rendu PDF d'un document généré par l'IA à partir d'un modèle (DocumentTemplate) — texte brut
 * uniquement, pagination simple. Le contenu vient toujours de IAIProvider.generateDocumentContent,
 * jamais composé ici : ce module ne fait que le mettre en page.
 */
export async function renderGeneratedDocumentPdf(input: { title: string; body: string; generatedAt: Date }): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(font.getCharacterSet());

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  const ink = rgb(0.13, 0.15, 0.18);
  const muted = rgb(0.42, 0.45, 0.5);

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const title = sanitizeForCharset(input.title, supported);
  newPageIfNeeded(28);
  page.drawText(title, { x: margin, y: y - 20, size: 16, font: bold, color: ink });
  y -= 36;

  const meta = sanitizeForCharset(`Généré le ${input.generatedAt.toLocaleDateString("fr-FR")}`, supported);
  newPageIfNeeded(16);
  page.drawText(meta, { x: margin, y: y - 10, size: 9, font, color: muted });
  y -= 28;

  const body = sanitizeForCharset(input.body, supported);
  const lines = wrapText(body, contentWidth, (s) => font.widthOfTextAtSize(s, 10.5));
  for (const line of lines) {
    newPageIfNeeded(16);
    page.drawText(line, { x: margin, y: y - 10, size: 10.5, font, color: ink });
    y -= 16;
  }

  return pdf.save();
}
