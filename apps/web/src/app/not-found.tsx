import { HardHat } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <HardHat className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Erreur 404
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Cette zone du chantier n&apos;existe pas.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Le lien est peut-etre obsolete. Revenez au cockpit pour poursuivre votre travail.
        </p>
        <Link
          href="/admin"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-95"
        >
          Revenir au cockpit
        </Link>
      </section>
    </main>
  );
}
