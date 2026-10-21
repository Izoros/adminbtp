"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
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
        <Badge tone="warning">Démonstration</Badge>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-graphite-700 hover:bg-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-chantier-orange" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-night-800 text-xs font-semibold text-white">
          MA
        </div>
      </div>
    </header>
  );
}
