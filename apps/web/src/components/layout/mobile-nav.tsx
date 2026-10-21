"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, HardHat } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="absolute inset-0 bg-night-950/60" onClick={onClose} aria-hidden="true" />
      <div className="relative flex w-64 flex-col bg-night-900 text-white shadow-xl">
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-chantier-orange">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">AdminBTP</span>
          </div>
          <button onClick={onClose} aria-label="Fermer la navigation" className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                  active ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
