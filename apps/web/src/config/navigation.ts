import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BookOpenCheck,
  Building2,
  FileText,
  FolderKanban,
  HandHelping,
  LayoutDashboard,
  LayoutPanelTop,
  Mail,
  Milestone,
  Network,
  ReceiptText,
  Signature,
  Workflow,
} from "lucide-react";

import type { NavigationSection } from "@/types/navigation";

type NavigationDefinition = {
  label: string;
  description: string;
  href: string;
  phase: string;
  icon: LucideIcon;
};

const coreItems: NavigationDefinition[] = [
  {
    label: "Didacticiel",
    description: "Parcours guide pour prendre AdminBTP en main.",
    href: "/guide",
    phase: "AIDE",
    icon: BookOpenCheck,
  },
  {
    label: "Vue du jour",
    description: "Priorites, alertes et activite des chantiers.",
    href: "/admin",
    phase: "OPS",
    icon: LayoutDashboard,
  },
  {
    label: "Organisations",
    description: "Socle des comptes, roles et membres.",
    href: "/organizations",
    phase: "P1",
    icon: Building2,
  },
  {
    label: "Projets",
    description: "Chantiers, roles projet et pilotage.",
    href: "/projects",
    phase: "P2",
    icon: FolderKanban,
  },
];

const businessItems: NavigationDefinition[] = [
  {
    label: "Phases",
    description: "Parcours chantier, checklists et alertes.",
    href: "/phases",
    phase: "P3",
    icon: Milestone,
  },
  {
    label: "Documents",
    description: "Base documentaire, templates et PDF.",
    href: "/documents",
    phase: "P4",
    icon: FileText,
  },
  {
    label: "Signatures",
    description: "Circuits de validation et audit log.",
    href: "/signatures",
    phase: "P5",
    icon: Signature,
  },
  {
    label: "Emails",
    description: "Boites generiques et rattachement metier.",
    href: "/emails",
    phase: "P6",
    icon: Mail,
  },
  {
    label: "Automatisations",
    description: "Relances et validations orchestrees.",
    href: "/n8n",
    phase: "P7",
    icon: Workflow,
  },
  {
    label: "Tresorerie",
    description: "Situations, relances et echeances.",
    href: "/followups",
    phase: "P8",
    icon: ReceiptText,
  },
  {
    label: "Social et RH",
    description: "Connexion Odoo pour les donnees sociales et RH.",
    href: "/odoo",
    phase: "P9",
    icon: Network,
  },
  {
    label: "Consulting",
    description: "Expertise ingenieur et architecte HMONP.",
    href: "/consulting",
    phase: "P10",
    icon: HandHelping,
  },
  {
    label: "Suggestions assistees",
    description: "Gouvernance et validation humaine des suggestions.",
    href: "/ai",
    phase: "P11",
    icon: Bot,
  },
  {
    label: "Espace client",
    description: "Portail simplifie pour validations et commentaires.",
    href: "/client-space",
    phase: "P12",
    icon: LayoutPanelTop,
  },
];

export const appNavigation: NavigationSection[] = [
  { title: "Pilotage", items: coreItems },
  { title: "Metier", items: businessItems },
];
