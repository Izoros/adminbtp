import {
  buildDocumentVariablesFromFormData,
} from "@/modules/documents/services/document-action-helpers";

describe("actions documentaires", () => {
  it("construit les variables de rendu a partir du formulaire", () => {
    const formData = new FormData();
    formData.set("recipientName", "MOE Kaweni");
    formData.set("projectName", "Renovation college Kaweni");
    formData.set("meetingDate", "2026-05-22");
    formData.set("progressSummary", "Lots techniques coordonnes");
    formData.set("attentionPoint", "Visa facade a verifier");
    formData.set("nextDeadline", "2026-05-30");
    formData.set("senderName", "Equipe AdminBTP");

    expect(buildDocumentVariablesFromFormData(formData)).toEqual({
      recipient_name: "MOE Kaweni",
      project_name: "Renovation college Kaweni",
      meeting_date: "2026-05-22",
      progress_summary: "Lots techniques coordonnes",
      attention_point: "Visa facade a verifier",
      next_deadline: "2026-05-30",
      sender_name: "Equipe AdminBTP",
    });
  });

  it("retombe sur des valeurs par defaut quand le formulaire est incomplet", () => {
    const formData = new FormData();

    const variables = buildDocumentVariablesFromFormData(formData);

    expect(variables.recipient_name).toBe("Interlocuteur chantier");
    expect(variables.project_name).toBe("Projet non renseigne");
    expect(variables.sender_name).toBe("Equipe AdminBTP");
  });
});
