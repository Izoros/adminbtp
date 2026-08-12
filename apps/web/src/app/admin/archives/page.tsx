import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { buildLoginRedirectPath } from "@/modules/auth/services/session-navigation";
import { ArchiveOperationsDashboard } from "@/modules/archival/components/archive-operations-dashboard";
import { loadArchiveOperationsData } from "@/modules/archival/services/archive-operations";

export default async function AdminArchivesPage() {
  const result = await loadArchiveOperationsData();

  if (result.access === "unauthenticated") {
    redirect(buildLoginRedirectPath("/admin/archives"));
  }

  return (
    <AppShell eyebrow="Exploitation et continuite" title="Archives AdminBTP">
      <div className="space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
        >
          <ArrowLeft className="size-4" />
          Retour au cockpit
        </Link>

        {result.access === "ready" ? (
          <ArchiveOperationsDashboard data={result.data} />
        ) : (
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-7 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-800">
                <LockKeyhole className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-stone-950">
                  Journal d&apos;archivage non accessible
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-700">
                  {result.message}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
