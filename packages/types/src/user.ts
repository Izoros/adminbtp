import { z } from "zod";
import { UserPermissionRole } from "./roles";

export const User = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid().nullable(), // null pour les comptes AdminBTP transverses
  email: z.string().email(),
  fullName: z.string().min(1),
  permissionRole: UserPermissionRole,
  avatarUrl: z.string().url().optional(),
  mfaEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
});
export type User = z.infer<typeof User>;

/**
 * Autorisation spécifique d'un utilisateur sur un chantier donné, en plus de son
 * permissionRole global (ex: un Validateur n'a ce droit que sur certains chantiers).
 */
export const SiteAccess = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  siteId: z.string().uuid(),
  canValidate: z.boolean().default(false),
  canEditDocuments: z.boolean().default(true),
  canManageFinance: z.boolean().default(false),
});
export type SiteAccess = z.infer<typeof SiteAccess>;
