import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewUserGuide } from "@/components/onboarding/new-user-guide";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type ModulePageFrameProps = {
  children: ReactNode;
};

export async function ModulePageFrame({ children }: ModulePageFrameProps) {
  const user = await getAuthenticatedUser();

  return (
    <>
      {user ? (
        <NewUserGuide
          userId={user.id}
          userLabel={user.email?.split("@")[0] ?? "dans AdminBTP"}
        />
      ) : null}
      <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[1.5rem] border border-white/80 bg-white/85 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <Breadcrumbs />
          </div>
          {children}
        </div>
      </main>
    </>
  )
}
