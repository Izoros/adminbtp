import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  tone?: "neutral" | "warning" | "danger";
}

export function KpiCard({ label, value, icon: Icon, href, tone = "neutral" }: KpiCardProps) {
  const content = (
    <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md",
          tone === "danger" && "bg-status-danger/10 text-status-danger",
          tone === "warning" && "bg-status-warning/10 text-status-warning",
          tone === "neutral" && "bg-surface-muted text-graphite-700"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-tight text-graphite-900">{value}</p>
        <p className="truncate text-xs text-graphite-500">{label}</p>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
