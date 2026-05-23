import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  description: string;
  href: string;
  phase: string;
  icon: LucideIcon;
};

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};
