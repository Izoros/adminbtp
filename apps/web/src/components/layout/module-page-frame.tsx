"use client";

import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";

type ModulePageFrameProps = {
  children: ReactNode;
};

export function ModulePageFrame({ children }: ModulePageFrameProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/85 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <Breadcrumbs />
        </div>
        {children}
      </div>
    </main>
  );
}
