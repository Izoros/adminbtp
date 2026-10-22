import {
  LayoutDashboard,
  Building2,
  HardHat,
  FileText,
  Mail,
  CheckSquare,
  ShieldCheck,
  BellRing,
  Settings,
  Users,
  Store,
  Crown,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/organisations", label: "Organisations clientes", icon: Building2 },
  { href: "/portefeuille", label: "Portefeuille gestionnaires", icon: Users },
  { href: "/chantiers", label: "Chantiers", icon: HardHat },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/mails", label: "Mails", icon: Mail },
  { href: "/taches", label: "Tâches", icon: CheckSquare },
  { href: "/validations", label: "Validations", icon: ShieldCheck },
  { href: "/relances", label: "Relances", icon: BellRing },
  { href: "/services", label: "Services & options", icon: Store },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

/** Visible uniquement pour permissionRole === "ADMIN_PLATEFORME" (Super Administrateur). */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Administration", icon: Crown },
];
