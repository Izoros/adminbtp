import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  reviewWhatsAppCommandAction,
  type WhatsAppCommandReviewState,
} from "@/modules/whatsapp/services/command-review-actions";

const initialState: WhatsAppCommandReviewState = {
  status: "idle",
  message: "",
};

function buildClient(platformAdmin = true) {
  const rpc = vi.fn().mockImplementation((functionName: string) => {
    if (functionName === "is_platform_admin") {
      return Promise.resolve({ data: platformAdmin, error: null });
    }

    if (functionName === "review_whatsapp_command") {
      return Promise.resolve({
        data: [{ id: "11111111-1111-4111-8111-111111111111" }],
        error: null,
      });
    }

    throw new Error(`RPC inattendue: ${functionName}`);
  });

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_1" } },
          error: null,
        }),
      },
      rpc,
    },
    rpc,
  };
}

function buildFormData(decision = "approve") {
  const formData = new FormData();
  formData.set("commandId", "11111111-1111-4111-8111-111111111111");
  formData.set("decision", decision);
  return formData;
}

describe("revue humaine des commandes WhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse une decision ou un identifiant non valide avant tout acces serveur", async () => {
    const formData = buildFormData("execute-now");

    await expect(
      reviewWhatsAppCommandAction(initialState, formData),
    ).resolves.toMatchObject({ status: "error", message: expect.stringMatching(/invalide/i) });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur qui n est pas administrateur plateforme", async () => {
    const client = buildClient(false);
    mocks.createClient.mockResolvedValue(client.client);

    await expect(
      reviewWhatsAppCommandAction(initialState, buildFormData()),
    ).resolves.toMatchObject({
      status: "error",
      message: expect.stringMatching(/administrateurs plateforme/i),
    });
    expect(client.rpc).not.toHaveBeenCalledWith(
      "review_whatsapp_command",
      expect.anything(),
    );
  });

  it("approuve atomiquement sans signaler une execution", async () => {
    const client = buildClient(true);
    mocks.createClient.mockResolvedValue(client.client);

    await expect(
      reviewWhatsAppCommandAction(initialState, buildFormData()),
    ).resolves.toEqual({
      status: "success",
      message: "Demande approuvee. Aucune action n'a ete executee.",
    });
    expect(client.rpc).toHaveBeenCalledWith("review_whatsapp_command", {
      target_command_id: "11111111-1111-4111-8111-111111111111",
      target_decision: "approve",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/commands");
  });

  it("journalise aussi le refus avec le contrat borne", async () => {
    const client = buildClient(true);
    mocks.createClient.mockResolvedValue(client.client);

    await expect(
      reviewWhatsAppCommandAction(initialState, buildFormData("reject")),
    ).resolves.toMatchObject({ status: "success", message: expect.stringMatching(/refusee/i) });
    expect(client.rpc).toHaveBeenCalledWith("review_whatsapp_command", {
      target_command_id: "11111111-1111-4111-8111-111111111111",
      target_decision: "reject",
    });
  });
});
