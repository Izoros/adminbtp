import {
  getOrganizationFeedbackFromSearchParams,
  parseOrganizationDraft,
  slugifyOrganizationName,
} from "@/modules/organizations/services/organization-write";

describe("ecriture des organisations", () => {
  it("genere un slug stable a partir du nom", () => {
    expect(slugifyOrganizationName("Atelier BTP Conseil Mayotte")).toBe(
      "atelier-btp-conseil-mayotte",
    );
  });

  it("normalise le formulaire organisation", () => {
    const formData = new FormData();
    formData.set("name", " Atelier BTP Conseil ");
    formData.set("slug", "");
    formData.set("legalName", " Atelier BTP Conseil SAS ");

    expect(parseOrganizationDraft(formData)).toEqual({
      name: "Atelier BTP Conseil",
      slug: "atelier-btp-conseil",
      legalName: "Atelier BTP Conseil SAS",
    });
  });

  it("retourne une erreur si le nom organisation est absent", () => {
    const formData = new FormData();
    formData.set("name", " ");

    expect(() => parseOrganizationDraft(formData)).toThrow(
      /nom de l'organisation est obligatoire/i,
    );
  });

  it("traduit un statut de succes en message lisible", () => {
    expect(
      getOrganizationFeedbackFromSearchParams({ organizationStatus: "created" }),
    ).toEqual({
      tone: "success",
      message:
        "L'organisation a ete creee dans Supabase puis rattachee a votre session.",
    });
  });

  it("ignore les messages d'erreur forges dans l'URL", () => {
    expect(
      getOrganizationFeedbackFromSearchParams({
        organizationErrorCode: "create_failed",
      }),
    ).toEqual({
      tone: "error",
      message:
        "La creation de l'organisation a echoue. Verifiez le nom et le slug, puis reessayez.",
    });
    expect(
      getOrganizationFeedbackFromSearchParams({
        organizationError: "Message arbitraire",
      }),
    ).toBeNull();
  });
});
