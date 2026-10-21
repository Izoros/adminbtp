"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar, type TopbarUser } from "./topbar";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: TopbarUser;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
