import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import type {
  DocumentTemplate,
  DocumentVariableMap,
  GeneratedDocument,
} from "@/modules/documents/types/document";

const variablePattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
const pdfFallbacks: Record<string, string> = {
  "≤": "<=",
  "≥": ">=",
  "㎡": "m2",
  "–": "-",
  "—": "-",
  " ": " ",
  " ": " ",
};
const pdfPageSize: [number, number] = [595.28, 841.89];
const pdfLeftMargin = 40;
const pdfBodyWidth = 510;
const pdfBodyFontSize = 11;
const pdfBodyLineHeight = 15;
const pdfBodyBottom = 115;

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

function sanitizePdfText(value: string, font: PDFFont) {
  let result = "";

  for (const character of value.replaceAll("\t", "    ")) {
    if (character === "\n" || character === "\r") {
      result += character;
      continue;
    }

    try {
      font.encodeText(character);
      result += character;
    } catch {
      result += pdfFallbacks[character] ?? "?";
    }
  }

  return result;
}

function splitOversizedWord(word: string, font: PDFFont, maxWidth: number) {
  const chunks: string[] = [];
  let chunk = "";

  for (const character of word) {
    const candidate = `${chunk}${character}`;

    if (chunk && font.widthOfTextAtSize(candidate, pdfBodyFontSize) > maxWidth) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk = candidate;
    }
  }

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

function wrapPdfLine(line: string, font: PDFFont, maxWidth: number) {
  if (!line.trim()) {
    return [""];
  }

  const words = line.trim().split(/\s+/).flatMap((word) =>
    font.widthOfTextAtSize(word, pdfBodyFontSize) > maxWidth
      ? splitOversizedWord(word, font, maxWidth)
      : [word],
  );
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (
      currentLine &&
      font.widthOfTextAtSize(candidate, pdfBodyFontSize) > maxWidth
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawPdfFooter(
  page: PDFPage,
  template: DocumentTemplate,
  font: PDFFont,
  fontBold: PDFFont,
) {
  page.drawText(sanitizePdfText(template.stampLabel, fontBold), {
    x: pdfLeftMargin,
    y: 70,
    size: 10,
    font: fontBold,
    color: rgb(0.5, 0.24, 0.14),
  });

  page.drawText(sanitizePdfText(template.signatureLabel, fontBold), {
    x: 420,
    y: 70,
    size: 10,
    font: fontBold,
    color: rgb(0.18, 0.18, 0.18),
  });
}

function addPdfPage(
  pdf: PDFDocument,
  template: DocumentTemplate,
  document: GeneratedDocument,
  font: PDFFont,
  fontBold: PDFFont,
  includeSubject: boolean,
) {
  const page = pdf.addPage(pdfPageSize);

  page.drawText(sanitizePdfText(template.letterheadName, fontBold), {
    x: pdfLeftMargin,
    y: 800,
    size: 18,
    font: fontBold,
    color: rgb(0.14, 0.14, 0.14),
  });

  page.drawText(sanitizePdfText(template.logoLabel, font), {
    x: 440,
    y: 800,
    size: 10,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  drawPdfFooter(page, template, font, fontBold);

  if (!includeSubject) {
    return { page, cursorY: 765 };
  }

  const subjectLines = wrapPdfLine(
    sanitizePdfText(document.subject, fontBold),
    fontBold,
    pdfBodyWidth,
  );
  let subjectY = 760;

  for (const subjectLine of subjectLines) {
    page.drawText(subjectLine, {
      x: pdfLeftMargin,
      y: subjectY,
      size: 13,
      font: fontBold,
      color: rgb(0.18, 0.18, 0.18),
    });
    subjectY -= 18;
  }

  return { page, cursorY: subjectY - 18 };
}

export async function generateSimplePdf(
  template: DocumentTemplate,
  document: GeneratedDocument,
) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let { page, cursorY } = addPdfPage(
    pdf,
    template,
    document,
    font,
    fontBold,
    true,
  );
  const bodyLines = sanitizePdfText(document.bodyRendered, font)
    .split("\n")
    .flatMap((line) => wrapPdfLine(line, font, pdfBodyWidth));

  for (const line of bodyLines) {
    const lineHeight = line ? pdfBodyLineHeight : 12;

    if (cursorY - lineHeight < pdfBodyBottom) {
      ({ page, cursorY } = addPdfPage(
        pdf,
        template,
        document,
        font,
        fontBold,
        false,
      ));
    }

    if (line) {
      page.drawText(line, {
        x: pdfLeftMargin,
        y: cursorY,
        size: pdfBodyFontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    cursorY -= lineHeight;
  }

  return pdf.save();
}
