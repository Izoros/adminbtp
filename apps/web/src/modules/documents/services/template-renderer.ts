import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type {
  DocumentTemplate,
  DocumentVariableMap,
  GeneratedDocument,
} from "@/modules/documents/types/document";

const variablePattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export function renderTemplate(
  template: DocumentTemplate,
  variables: DocumentVariableMap,
): GeneratedDocument {
  const subject = replaceVariables(template.subject, variables);
  const bodyRendered = replaceVariables(template.bodyTemplate, variables);

  return {
    id: `generated_${template.id}`,
    templateId: template.id,
    title: `${template.name} - ${variables.project_name ?? "sans projet"}`,
    subject,
    bodyRendered,
    status: "generated",
  };
}

export function replaceVariables(source: string, variables: DocumentVariableMap) {
  return source.replace(variablePattern, (_, variableName: string) => {
    return variables[variableName] ?? `[${variableName}]`;
  });
}

export async function generateSimplePdf(
  template: DocumentTemplate,
  document: GeneratedDocument,
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // On garde un PDF simple et robuste pour la phase 4 : entete, metadonnees et corps texte.
  page.drawText(template.letterheadName, {
    x: 40,
    y: 800,
    size: 18,
    font: fontBold,
    color: rgb(0.14, 0.14, 0.14),
  });

  page.drawText(template.logoLabel, {
    x: 440,
    y: 800,
    size: 10,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  page.drawText(document.subject, {
    x: 40,
    y: 760,
    size: 13,
    font: fontBold,
    color: rgb(0.18, 0.18, 0.18),
  });

  const bodyLines = document.bodyRendered.split("\n");
  let cursorY = 720;

  bodyLines.forEach((line) => {
    page.drawText(line, {
      x: 40,
      y: cursorY,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: 510,
    });
    cursorY -= line.trim() === "" ? 14 : 18;
  });

  page.drawText(template.stampLabel, {
    x: 40,
    y: 80,
    size: 10,
    font: fontBold,
    color: rgb(0.62, 0.35, 0.22),
  });

  page.drawText(template.signatureLabel, {
    x: 420,
    y: 80,
    size: 10,
    font: fontBold,
    color: rgb(0.18, 0.18, 0.18),
  });

  return pdf.save();
}
