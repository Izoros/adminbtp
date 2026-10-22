"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar, type TopbarUser } from "./topbar";
import { MobileNav } from "./mobile-nav";
import type { Organization } from "@adminbtp/types";

export function AppShell({
  children,
  user,
  organizations,
  activeOrganizationId,
}: {
  children: React.ReactNode;
  user: TopbarUser;
  organizations: Organization[];
  activeOrganizationId: string | null;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle">
      <Sidebar permissionRole={user.permissionRole} />
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        permissionRole={user.permissionRole}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileNavOpen(true)}
          user={user}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
