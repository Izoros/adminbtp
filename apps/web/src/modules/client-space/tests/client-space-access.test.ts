import { describe, expect, it } from "vitest";

import {
  filterCommentsForVisibleItems,
  filterWorkspaceItemsForViewer,
  getCommentsForWorkspaceItem,
  getWorkspaceItemsForClient,
  resolveWorkspaceItemStatus,
  updateClientActionStatus,
} from "@/modules/client-space/services/client-space-access";
import {
  demoClientComments,
  demoClientWorkspaceItems,
} from "@/modules/client-space/services/demo-client-space";

describe("client-space-access", () => {
  it("n expose que les donnees du client courant", () => {
    const items = getWorkspaceItemsForClient(
      demoClientWorkspaceItems,
      "org_client_004",
    );

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.clientOrganizationId === "org_client_004")).toBe(
      true,
    );
  });

  it("autorise un changement de statut cote client", () => {
    const updatedItem = updateClientActionStatus(
      demoClientWorkspaceItems[0]!,
      "approved",
    );

    expect(updatedItem.status).toBe("approved");
  });

  it("retourne les commentaires lies a un element", () => {
    const comments = getCommentsForWorkspaceItem(
      demoClientComments,
      "client_item_002",
    );

    expect(comments).toHaveLength(2);
  });

  it("filtre les elements selon le mode viewer", () => {
    const internalItems = filterWorkspaceItemsForViewer(
      demoClientWorkspaceItems,
      ["org_adminbtp_001"],
      "internal",
    );
    const clientItems = filterWorkspaceItemsForViewer(
      demoClientWorkspaceItems,
      ["org_client_004"],
      "client",
    );

    expect(internalItems).toHaveLength(3);
    expect(clientItems).toHaveLength(2);
  });

  it("retire les commentaires hors des elements visibles", () => {
    const visibleItems = demoClientWorkspaceItems.filter(
      (item) => item.id === "client_item_002",
    );

    expect(filterCommentsForVisibleItems(demoClientComments, visibleItems)).toHaveLength(2);
  });

  it("deduit le statut client depuis la derniere decision visible", () => {
    expect(
      resolveWorkspaceItemStatus(demoClientWorkspaceItems[1]!, demoClientComments),
    ).toBe("commented");
  });
});
