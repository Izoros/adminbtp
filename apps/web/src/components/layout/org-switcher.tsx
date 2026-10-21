"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { setActiveOrganization } from "@/lib/actions/organization-context";
import type { Organization } from "@adminbtp/types";

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: Organization[];
  activeOrganizationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const active = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0];

  if (!active || organizations.length === 0) return null;

  function handleSelect(id: string) {
    setOpen(false);
    if (id === active.id) return;
    startTransition(() => {
      setActiveOrganization(id);
    });
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex h-9 max-w-[140px] items-center gap-1.5 rounded-md border border-surface-border bg-surface-white px-2 text-sm text-graphite-900 hover:bg-surface-muted disabled:opacity-60 sm:max-w-[220px] sm:gap-2 sm:px-3"
        aria-label="Changer d'organisation active"
      >
        <Building2 className="h-4 w-4 flex-shrink-0 text-graphite-500" />
        <span className="hidden truncate sm:inline">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-graphite-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-10 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-surface-border bg-surface-white p-1.5 shadow-lg">
          <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-graphite-500">
            Organisation active
          </p>
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => handleSelect(org.id)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-graphite-900 hover:bg-surface-muted"
            >
              <span className="truncate">{org.name}</span>
              {org.id === active.id && <Check className="h-4 w-4 flex-shrink-0 text-status-success" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
