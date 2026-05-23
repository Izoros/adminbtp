import type {
  ClientComment,
  ClientWorkspaceItem,
} from "@/modules/client-space/types/client-space";

export const demoClientWorkspaceItems: ClientWorkspaceItem[] = [
  {
    id: "client_item_001",
    organizationId: "org_adminbtp_001",
    clientOrganizationId: "org_client_004",
    projectId: "project_001",
    type: "document",
    title: "Situation de travaux mai 2026",
    summary: "Document pret pour consultation et retour client.",
    status: "pending",
  },
  {
    id: "client_item_002",
    organizationId: "org_adminbtp_001",
    clientOrganizationId: "org_client_004",
    projectId: "project_001",
    type: "validation",
    title: "Validation du courrier de relance",
    summary: "Le client peut valider, refuser ou commenter le projet de courrier.",
    status: "commented",
  },
  {
    id: "client_item_003",
    organizationId: "org_adminbtp_001",
    clientOrganizationId: "org_hidden_003",
    projectId: "project_002",
    type: "ticket",
    title: "Ticket non visible",
    summary: "Cet element ne doit jamais apparaitre pour un autre client.",
    status: "pending",
  },
];

export const demoClientComments: ClientComment[] = [
  {
    id: "client_comment_001",
    workspaceItemId: "client_item_002",
    clientOrganizationId: "org_client_004",
    authorRole: "client",
    message: "Merci d'ajouter la reference du lot facade avant validation finale.",
  },
  {
    id: "client_comment_002",
    workspaceItemId: "client_item_002",
    clientOrganizationId: "org_client_004",
    authorRole: "adminbtp",
    message: "Mise a jour prevue avant nouvel envoi au signataire.",
  },
];
