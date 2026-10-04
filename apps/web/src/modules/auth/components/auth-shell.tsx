import { Building2 } from "lucide-react";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-md items-center px-4 pt-10 sm:px-0">
        <Link href="/" className="flex items-center gap-3" aria-label="AdminBTP, accueil">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-[-0.04em]">AdminBTP</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-0">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <h1 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </section>

        {footer ? <div className="mt-6 text-center text-sm text-stone-600">{footer}</div> : null}
      </main>
    </div>
  );
}
