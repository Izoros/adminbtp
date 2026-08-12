import {
  demoDocumentTemplates,
  demoDocumentVariables,
} from "@/modules/documents/services/demo-documents";
import {
  generateSimplePdf,
  renderTemplate,
  replaceVariables,
} from "@/modules/documents/services/template-renderer";
import { PDFDocument } from "pdf-lib";

describe("rendu de templates documentaires", () => {
  it("remplace correctement les variables dynamiques", () => {
    expect(
      replaceVariables("Bonjour {{recipient_name}}", demoDocumentVariables),
    ).toBe("Bonjour Atelier MOE");
  });

  it("genere un document a partir du template", () => {
    const generatedDocument = renderTemplate(
      demoDocumentTemplates[0]!,
      demoDocumentVariables,
    );

    expect(generatedDocument.subject).toContain("Renovation college Kaweni");
    expect(generatedDocument.bodyRendered).toContain(
      "interface CVC / electricite a arbitrer",
    );
  });

  it("genere un PDF simple exploitable", async () => {
    const generatedDocument = renderTemplate(
      demoDocumentTemplates[0]!,
      demoDocumentVariables,
    );

    const pdfBytes = await generateSimplePdf(
      demoDocumentTemplates[0]!,
      generatedDocument,
    );

    expect(pdfBytes.length).toBeGreaterThan(500);
  });

  it("gere les caracteres hors WinAnsi, le repli et les pages multiples", async () => {
    const template = demoDocumentTemplates[0]!;
    const generatedDocument = {
      ...renderTemplate(template, demoDocumentVariables),
      subject: "Controle ≤ 5 ㎡ 🏗️",
      bodyRendered: Array.from(
        { length: 90 },
        (_, index) =>
          `Ligne ${index + 1} — verification technique avec une phrase suffisamment longue pour provoquer un repli automatique sans chevauchement.`,
      ).join("\n"),
    };

    const pdfBytes = await generateSimplePdf(template, generatedDocument);
    const pdf = await PDFDocument.load(pdfBytes);

    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
