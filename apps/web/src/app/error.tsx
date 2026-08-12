"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[AdminBTP][ui] route_render_failed", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Cette page n&apos;a pas pu etre chargee.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground" role="alert">
          Aucun detail technique n&apos;est affiche. Vous pouvez relancer la page ou
          revenir au cockpit.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-95"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reessayer
          </button>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium"
          >
            Revenir au cockpit
          </Link>
        </div>
      </section>
    </main>
  );
}
