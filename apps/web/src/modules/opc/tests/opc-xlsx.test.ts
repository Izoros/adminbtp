import JSZip from "jszip";

import { createOpcXlsx } from "@/modules/opc/services/opc-xlsx";

describe("export XLSX OPC", () => {
  it("genere un classeur Open XML lisible avec une feuille planning", async () => {
    const bytes = await createOpcXlsx([
      ["Code", "Tache", "Marge"],
      ["T01", "Installation", 0],
      ["T02", "Fondations", 4],
    ]);
    const archive = await JSZip.loadAsync(bytes);
    const workbook = await archive.file("xl/workbook.xml")?.async("string");
    const worksheet = await archive
      .file("xl/worksheets/sheet1.xml")
      ?.async("string");

    expect(workbook).toContain("Planning OPC");
    expect(worksheet).toContain("Fondations");
    expect(worksheet).toContain('autoFilter ref="A1:M3"');
  });
});
