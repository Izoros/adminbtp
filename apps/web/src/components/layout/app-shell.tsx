import { Building2, LayoutDashboard, LogIn, LogOut, Settings2 } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewUserGuide } from "@/components/onboarding/new-user-guide";
import { appNavigation } from "@/config/navigation";
import { getSupabaseProjectRef } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type AppShellProps = {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
};

export async function AppShell({
  children,
  eyebrow = "Plateforme administrative et technique",
  title = "Tableau de lancement",
}: AppShellProps) {
  const user = await getAuthenticatedUser();
  const supabaseProjectRef = getSupabaseProjectRef();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_32%,#f5f2ec_100%)] text-stone-950">
      {user ? (
        <NewUserGuide
          userId={user.id}
          userLabel={user.email?.split("@")[0] ?? "dans AdminBTP"}
        />
      ) : null}
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-4 md:px-6 xl:px-8">
        <aside className="hidden w-80 shrink-0 rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,#241f1c_0%,#181513_100%)] p-6 text-stone-100 shadow-[0_28px_80px_rgba(15,23,42,0.28)] lg:flex lg:flex-col">
          <div className="flex items-center gap-4 border-b border-white/10 pb-5">
            <div className="rounded-2xl bg-[#e07a5f] p-3 text-white shadow-[0_12px_24px_rgba(224,122,95,0.35)]">
              <Building2 className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">AdminBTP</p>
              <p className="text-sm text-stone-400">Pilotage administratif et technique</p>
            </div>
          </div>

          <nav className="mt-6 space-y-6">
            {appNavigation.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-xs font-medium tracking-[0.24em] text-stone-500 uppercase">
                  {section.title}
                </p>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-white/6"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4 text-stone-300" />
                          <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="text-xs text-stone-400">{item.description}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-[1.75rem] border border-white/80 bg-white/85 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-stone-950 p-2.5 text-white lg:hidden">
                  <LayoutDashboard className="size-4" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">{eyebrow}</p>
                  <h1 className="text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                    {title}
                  </h1>
                  <Breadcrumbs />
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  <Settings2 className="size-4 text-stone-500" />
                  {user ? "Session Supabase active" : "Session requise"}
                </div>

                {supabaseProjectRef ? (
                  <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700">
                    <span className="font-medium text-stone-900">Projet Supabase</span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 font-mono text-xs text-stone-700">
                      {supabaseProjectRef}
                    </span>
                  </div>
                ) : null}

                {user ? (
                  <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                    <span className="max-w-48 truncate">{user.email}</span>
                    <Link
                      href="/auth/logout"
                      className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800"
                    >
                      <LogOut className="size-3.5" />
                      Quitter
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    <LogIn className="size-4" />
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
