"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { appNavigation } from "@/config/navigation";

function formatSegmentLabel(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildLabelMap() {
  return new Map<string, string>([
    ["/", "Accueil"],
    ...appNavigation.flatMap((section) =>
      section.items.map((item) => [item.href, item.label] as const),
    ),
    ["/auth", "Authentification"],
    ["/auth/callback", "Retour connexion"],
    ["/auth/logout", "Deconnexion"],
    ["/auth/password-login", "Connexion mot de passe"],
  ]);
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/" || pathname.startsWith("/api")) {
    return null;
  }

  const labelMap = buildLabelMap();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500"
    >
      <Link href="/" className="transition hover:text-stone-900">
        Accueil
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labelMap.get(href) ?? formatSegmentLabel(segment);

        return (
          <span key={href} className="inline-flex items-center gap-2">
            <ChevronRight className="size-4 text-stone-400" />
            {isLast ? (
              <span className="font-medium text-stone-900">{label}</span>
            ) : (
              <Link href={href} className="transition hover:text-stone-900">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
