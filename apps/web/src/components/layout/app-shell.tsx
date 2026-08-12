import {
  BookOpenCheck,
  Building2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ReceiptText,
  Settings2,
  X,
} from "lucide-react";
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

const mobileNavigation = [
  { href: "/admin", label: "Aujourd'hui", icon: LayoutDashboard },
  { href: "/projects", label: "Chantiers", icon: FolderKanban },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/followups", label: "Tresorerie", icon: ReceiptText },
  { href: "/guide", label: "Aide", icon: BookOpenCheck },
] as const;

export async function AppShell({
  children,
  eyebrow = "Plateforme administrative et technique",
  title = "Tableau de lancement",
}: AppShellProps) {
  const user = await getAuthenticatedUser();
  const supabaseProjectRef = getSupabaseProjectRef();

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground lg:pb-0">
      {user ? (
        <NewUserGuide
          userId={user.id}
          userLabel={user.email?.split("@")[0] ?? "dans AdminBTP"}
        />
      ) : null}
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-4 md:px-6 xl:px-8">
        <aside className="hidden w-80 shrink-0 rounded-2xl border border-sidebar-border bg-sidebar p-6 text-sidebar-foreground shadow-xl lg:flex lg:flex-col">
          <div className="flex items-center gap-4 border-b border-white/10 pb-5">
            <div className="rounded-xl bg-sidebar-primary p-3 text-sidebar-primary-foreground">
              <Building2 className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">AdminBTP</p>
              <p className="text-sm text-stone-400">Pilotage administratif et technique</p>
            </div>
          </div>

          <nav className="mt-6 space-y-6" aria-label="Navigation principale">
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
                          <item.icon className="size-4 text-stone-300" aria-hidden="true" />
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
          <header className="relative z-40 rounded-2xl border border-border bg-card/95 px-5 py-4 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <details className="group relative lg:hidden">
                  <summary
                    className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground [&::-webkit-details-marker]:hidden"
                    aria-label="Ouvrir la navigation"
                  >
                    <Menu className="size-5 group-open:hidden" aria-hidden="true" />
                    <X className="hidden size-5 group-open:block" aria-hidden="true" />
                  </summary>
                  <div className="fixed inset-x-4 top-24 z-50 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-2xl">
                    <nav className="space-y-5" aria-label="Navigation mobile complete">
                      {appNavigation.map((section) => (
                        <div key={section.title} className="space-y-2">
                          <p className="px-3 text-xs font-medium tracking-[0.2em] text-stone-400 uppercase">
                            {section.title}
                          </p>
                          <ul className="space-y-1">
                            {section.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:bg-white/10"
                                >
                                  <item.icon className="size-4 text-stone-300" aria-hidden="true" />
                                  <span>{item.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </nav>
                  </div>
                </details>
                <div>
                  <p className="text-sm text-stone-500">{eyebrow}</p>
                  <h1 className="text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                    {title}
                  </h1>
                  <Breadcrumbs />
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Link
                  href="/guide"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                >
                  <BookOpenCheck className="size-4" aria-hidden="true" />
                  Didacticiel
                </Link>
                <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
                  <Settings2 className="size-4 text-stone-500" aria-hidden="true" />
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
                      <LogOut className="size-3.5" aria-hidden="true" />
                      Quitter
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    <LogIn className="size-4" aria-hidden="true" />
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-10px_30px_rgba(15,23,42,0.1)] backdrop-blur lg:hidden"
        aria-label="Raccourcis mobiles"
      >
        {mobileNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
          >
            <item.icon className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
