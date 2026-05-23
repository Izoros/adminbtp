import { demoSignatureRequests } from "@/modules/signatures/services/demo-signatures";
import {
  buildAuditLogEntry,
  canTransitionSignatureRequest,
  prepareWhatsappValidationMessage,
} from "@/modules/signatures/services/signature-flow";

describe("circuit de validation signature", () => {
  it("autorise la transition interne vers la demande de signature", () => {
    expect(
      canTransitionSignatureRequest(
        "pending_internal_validation",
        "pending_signature",
      ),
    ).toBe(true);
  });

  it("refuse l'approbation directe sans etape intermediaire", () => {
    expect(
      canTransitionSignatureRequest(
        "pending_internal_validation",
        "approved",
      ),
    ).toBe(false);
  });

  it("genere une entree d'audit log tracable", () => {
    const entry = buildAuditLogEntry(
      demoSignatureRequests[0]!,
      "signature_requested",
      "Signature demandee",
    );

    expect(entry.entityId).toBe("signature_request_001");
    expect(entry.actionType).toBe("signature_requested");
  });

  it("prepare un message WhatsApp exploitable", () => {
    const payload = prepareWhatsappValidationMessage(demoSignatureRequests[0]!);

    expect(payload.channel).toBe("whatsapp");
    expect(payload.requestId).toBe("signature_request_001");
    expect(payload.template).toBe("signature_validation_v1");
    expect(payload.body).toContain("Merci de confirmer la validation.");
  });
});
