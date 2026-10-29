"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@adminbtp/types";

interface AuditLogCsvExportButtonProps {
  entries: AuditLogEntry[];
  organizationNames: Record<string, string>;
  actorNames: Record<string, string>;
}

const CSV_HEADER = [
  "Horodatage",
  "Organisation",
  "Auteur",
  "Type d'auteur",
  "Action",
  "Cible (type)",
  "Cible (id)",
  "Métadonnées",
];

function escapeCsvCell(value: string): string {
  if (/[",;\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export CSV généré côté client à partir des lignes déjà chargées (page filtrée courante) —
 * pas d'endpoint dédié tant que le volume ne l'exige pas, cf. docs/ROADMAP.md Phase 9.
 */
export function AuditLogCsvExportButton({
  entries,
  organizationNames,
  actorNames,
}: AuditLogCsvExportButtonProps) {
  function handleExport() {
    const rows = entries.map((entry) => [
      new Date(entry.createdAt).toLocaleString("fr-FR", { timeZone: "Indian/Mayotte" }),
      organizationNames[entry.organizationId] ?? entry.organizationId,
      entry.actorUserId ? actorNames[entry.actorUserId] ?? entry.actorUserId : "—",
      entry.actorType,
      entry.action,
      entry.targetType,
      entry.targetId,
      JSON.stringify(entry.metadata ?? {}),
    ]);

    const csv = [CSV_HEADER, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(";"))
      .join("\n");

    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={entries.length === 0}>
      <Download className="h-4 w-4" />
      Exporter la page en CSV
    </Button>
  );
}
