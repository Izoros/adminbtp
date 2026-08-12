import { describe, expect, it } from "vitest";

import {
  classifyWhatsAppCommand,
  extractWhatsAppCommandCandidates,
} from "@/modules/whatsapp/services/webhook-payload";

function buildPayload(body = "Continue le developpement") {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "phone_business_1" },
              messages: [
                {
                  from: "262690000000",
                  id: "wamid.command.1",
                  timestamp: "1786500000",
                  type: "text",
                  text: { body },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe("payload webhook WhatsApp", () => {
  it("extrait et normalise uniquement un message texte exploitable", () => {
    expect(extractWhatsAppCommandCandidates(buildPayload())).toEqual([
      expect.objectContaining({
        providerMessageId: "wamid.command.1",
        businessPhoneNumberId: "phone_business_1",
        senderPhone: "+262690000000",
        commandText: "Continue le developpement",
        commandKind: "development_request",
      }),
    ]);
  });

  it("classe les commandes de lecture sans les executer", () => {
    expect(classifyWhatsAppCommand("aide")).toBe("help");
    expect(classifyWhatsAppCommand("État du service")).toBe("status_check");
    expect(classifyWhatsAppCommand("Archives aujourd'hui")).toBe(
      "archive_status",
    );
  });

  it("ignore les statuts, medias et textes trop longs", () => {
    const payload = buildPayload("x".repeat(2_001));
    const value = payload.entry[0].changes[0].value;
    value.messages.push({
      from: "262690000000",
      id: "wamid.image.1",
      timestamp: "1786500000",
      type: "image",
      text: { body: "faux texte" },
    });

    expect(extractWhatsAppCommandCandidates(payload)).toEqual([]);
    expect(
      extractWhatsAppCommandCandidates({
        object: "whatsapp_business_account",
        entry: [{ changes: [{ value: { statuses: [{ id: "status_1" }] } }] }],
      }),
    ).toEqual([]);
  });
});
