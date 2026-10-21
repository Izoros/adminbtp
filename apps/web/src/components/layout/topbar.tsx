"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { USER_PERMISSION_LABELS, type UserPermissionRole } from "@adminbtp/types";

export interface TopbarUser {
  email: string;
  fullName: string;
  permissionRole: UserPermissionRole | null;
  organizationId: string | null;
}

function initialsFor(name: string) {
  const letters = name.match(/\p{L}+/gu) ?? [];
  if (letters.length === 0) return "?";
  if (letters.length === 1) return letters[0]!.slice(0, 2).toUpperCase();
  return (letters[0]![0]! + letters[letters.length - 1]![0]!).toUpperCase();
}

export function Topbar({
  onMenuClick,
  user,
}: {
  onMenuClick?: () => void;
  user: TopbarUser;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-surface-border bg-surface-white px-4 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-md text-graphite-700 hover:bg-surface-muted md:hidden"
        aria-label="Ouvrir la navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
        <Input
          type="search"
          placeholder="Rechercher un chantier, un document, un contact…"
          className="pl-9"
          aria-label="Recherche globale"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {!user.organizationId && user.permissionRole !== "ADMIN_PLATEFORME" && (
          <Badge tone="warning">Sans organisation</Badge>
        )}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-graphite-700 hover:bg-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-chantier-orange" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-night-800 text-xs font-semibold text-white"
            aria-label="Menu utilisateur"
          >
            {initialsFor(user.fullName)}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-56 rounded-lg border border-surface-border bg-surface-white p-2 shadow-lg">
              <p className="truncate px-2 py-1 text-sm font-medium text-graphite-900">
                {user.fullName}
              </p>
              <p className="truncate px-2 pb-2 text-xs text-graphite-500">
                {user.permissionRole ? USER_PERMISSION_LABELS[user.permissionRole] : user.email}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-graphite-700 hover:bg-surface-muted"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
