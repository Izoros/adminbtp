export default function Loading() {
  return (
    <main
      className="min-h-screen bg-background px-5 py-8 text-foreground"
      aria-busy="true"
      aria-label="Chargement de la page"
    >
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-44 rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-44 rounded-2xl bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-muted" />
          ))}
        </div>
        <span className="sr-only">Chargement en cours…</span>
      </div>
    </main>
  );
}
