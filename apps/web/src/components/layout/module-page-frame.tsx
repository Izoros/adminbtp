import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

type ModulePageFrameProps = {
  children: ReactNode;
};

export function ModulePageFrame({ children }: ModulePageFrameProps) {
  return (
    <AppShell eyebrow="Espace metier AdminBTP" title="Pilotage chantier">
      <div className="mx-auto max-w-6xl space-y-6">{children}</div>
    </AppShell>
  );
}
