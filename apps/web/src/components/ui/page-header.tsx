export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-graphite-900">{title}</h1>
        {description && <p className="text-sm text-graphite-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
