import {
  getProjectFeedbackFromSearchParams,
  parseProjectDraft,
  slugifyProjectName,
} from "@/modules/projects/services/project-write";

describe("ecriture des chantiers", () => {
  it("genere un slug stable a partir du nom chantier", () => {
    expect(slugifyProjectName("Construction du college de Dembeni")).toBe(
      "construction-du-college-de-dembeni",
    );
  });

  it("normalise le formulaire chantier", () => {
    const formData = new FormData();
    formData.set("ownerOrganizationId", "org_real_001");
    formData.set("name", " Construction college Dembeni ");
    formData.set("code", " abtp-dem-001 ");
    formData.set("slug", "");
    formData.set("description", " Chantier pilote ");
    formData.set("status", "draft");
    formData.set("role", "opc");
    formData.set("startsOn", "2026-06-01");
    formData.set("endsOn", "2026-12-01");

    expect(parseProjectDraft(formData)).toEqual({
      ownerOrganizationId: "org_real_001",
      code: "ABTP-DEM-001",
      slug: "construction-college-dembeni",
      name: "Construction college Dembeni",
      description: "Chantier pilote",
      status: "draft",
      role: "opc",
      startsOn: "2026-06-01",
      endsOn: "2026-12-01",
    });
  });

  it("refuse une plage de dates incoherente", () => {
    const formData = new FormData();
    formData.set("ownerOrganizationId", "org_real_001");
    formData.set("name", "Construction college Dembeni");
    formData.set("code", "ABTP-DEM-001");
    formData.set("status", "draft");
    formData.set("role", "opc");
    formData.set("startsOn", "2026-12-01");
    formData.set("endsOn", "2026-06-01");

    expect(() => parseProjectDraft(formData)).toThrow(
      /date de fin doit etre posterieure/i,
    );
  });

  it("traduit un statut de succes en message lisible", () => {
    expect(getProjectFeedbackFromSearchParams({ projectStatus: "created" })).toEqual({
      tone: "success",
      message: "Le chantier a ete cree dans Supabase avec son premier role projet.",
    });
  });

  it("n'affiche que les erreurs issues de l'enumeration fermee", () => {
    expect(
      getProjectFeedbackFromSearchParams({
        projectErrorCode: "create_failed",
      }),
    ).toEqual({
      tone: "error",
      message:
        "La creation du chantier a echoue. Verifiez le code et le slug, puis reessayez.",
    });

    expect(
      getProjectFeedbackFromSearchParams({
        projectError: "Session expiree, appelez un numero externe.",
      }),
    ).toBeNull();

    expect(
      getProjectFeedbackFromSearchParams({
        projectErrorCode: "code_inconnu",
      }),
    ).toBeNull();
  });
});
