import type {
  ClientActionStatus,
  ClientComment,
  ClientDecision,
  ClientWorkspaceItem,
} from "@/modules/client-space/types/client-space";

export function getWorkspaceItemsForClient(
  items: ClientWorkspaceItem[],
  clientOrganizationId: string,
) {
  return items.filter((item) => item.clientOrganizationId === clientOrganizationId);
}

export function getCommentsForWorkspaceItem(
  comments: ClientComment[],
  workspaceItemId: string,
) {
  return comments.filter((comment) => comment.workspaceItemId === workspaceItemId);
}

export function canAccessWorkspaceItem(
  item: ClientWorkspaceItem,
  viewerOrganizationIds: string[],
  viewerMode: "internal" | "client",
) {
  if (viewerMode === "internal") {
    return viewerOrganizationIds.includes(item.organizationId);
  }

  return viewerOrganizationIds.includes(item.clientOrganizationId);
}

export function filterWorkspaceItemsForViewer(
  items: ClientWorkspaceItem[],
  viewerOrganizationIds: string[],
  viewerMode: "internal" | "client",
) {
  return items.filter((item) =>
    canAccessWorkspaceItem(item, viewerOrganizationIds, viewerMode),
  );
}

export function filterCommentsForVisibleItems(
  comments: ClientComment[],
  visibleItems: ClientWorkspaceItem[],
) {
  const visibleItemIds = new Set(visibleItems.map((item) => item.id));
  const visibleClientOrganizationIds = new Set(
    visibleItems.map((item) => item.clientOrganizationId),
  );

  return comments.filter(
    (comment) =>
      visibleItemIds.has(comment.workspaceItemId) &&
      visibleClientOrganizationIds.has(comment.clientOrganizationId),
  );
}

export function updateClientActionStatus(
  item: ClientWorkspaceItem,
  status: ClientDecision,
) {
  return {
    ...item,
    status,
  };
}

export function resolveWorkspaceItemStatus(
  item: ClientWorkspaceItem,
  comments: ClientComment[],
): ClientActionStatus {
  const decisionComment = comments.find(
    (comment) =>
      comment.workspaceItemId === item.id &&
      comment.authorRole === "client" &&
      comment.decision,
  );

  return decisionComment?.decision ?? item.status;
}
