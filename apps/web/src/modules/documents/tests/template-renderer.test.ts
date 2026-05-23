import {
  demoDocumentTemplates,
  demoDocumentVariables,
} from "@/modules/documents/services/demo-documents";
import {
  generateSimplePdf,
  renderTemplate,
  replaceVariables,
} from "@/modules/documents/services/template-renderer";

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
});
