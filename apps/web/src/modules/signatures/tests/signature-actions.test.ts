import {
  buildSignatureTransitionLabel,
  mapStatusToAuditAction,
} from "@/modules/signatures/services/signature-action-helpers";

describe("actions signatures", () => {
  it("associe un libelle metier a chaque transition", () => {
    expect(buildSignatureTransitionLabel("pending_signature")).toBe(
      "Signature externe preparee",
    );
    expect(buildSignatureTransitionLabel("approved")).toBe("Demande approuvee");
    expect(buildSignatureTransitionLabel("rejected")).toBe("Demande rejetee");
  });

  it("mappe le statut cible vers une action d'audit compatible", () => {
    expect(mapStatusToAuditAction("pending_signature")).toBe("signature_requested");
    expect(mapStatusToAuditAction("approved")).toBe("approved");
    expect(mapStatusToAuditAction("rejected")).toBe("rejected");
    expect(mapStatusToAuditAction("pending_internal_validation")).toBe("submitted");
  });
});
