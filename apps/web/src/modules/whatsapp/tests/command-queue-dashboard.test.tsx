import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommandQueueDashboard } from "@/modules/whatsapp/components/command-queue-dashboard";
import type { WhatsAppCommandQueueData } from "@/modules/whatsapp/types/command";

function buildData(status: "pending_review" | "approved"): WhatsAppCommandQueueData {
  return {
    updatedAt: "2026-08-12T04:00:00.000Z",
    sourceMessage: "Une demande chargee.",
    totalCommands: 1,
    pendingCommands: status === "pending_review" ? 1 : 0,
    completedCommands: 0,
    failedCommands: 0,
    commands: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        providerMessageId: "wamid.command.1",
        senderFingerprint: "a".repeat(64),
        commandText: "Continue le developpement",
        commandKind: "development_request",
        status,
        providerSentAt: "2026-08-12T03:59:00.000Z",
        receivedAt: "2026-08-12T04:00:00.000Z",
        reviewedAt: status === "approved" ? "2026-08-12T04:01:00.000Z" : null,
        completedAt: null,
        responseSummary: null,
        retentionUntil: "2026-11-10T04:00:00.000Z",
      },
    ],
  };
}

describe("tableau des commandes WhatsApp", () => {
  it("propose les deux decisions seulement pour une demande en attente", () => {
    const { rerender } = render(
      <CommandQueueDashboard data={buildData("pending_review")} />,
    );

    expect(screen.getByRole("button", { name: /Approuver la demande/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refuser" })).toBeInTheDocument();

    rerender(<CommandQueueDashboard data={buildData("approved")} />);

    expect(screen.queryByRole("button", { name: /Approuver/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refuser" })).not.toBeInTheDocument();
    expect(screen.getByText("Approuvee")).toBeInTheDocument();
  });
});
