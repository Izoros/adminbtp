"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardHat } from "lucide-react";
import { ADMIN_NAV_ITEMS, NAV_ITEMS, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { UserPermissionRole } from "@adminbtp/types";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ permissionRole }: { permissionRole?: UserPermissionRole | null }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col bg-night-900 text-white md:flex">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-white/10">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-chantier-orange">
          <HardHat className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-wide">AdminBTP</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
        {permissionRole === "ADMIN_PLATEFORME" && (
          <>
            <div className="my-2 border-t border-white/10" />
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-xs text-white/50">
        Mode démonstration — données fictives
      </div>
    </aside>
  );
}
