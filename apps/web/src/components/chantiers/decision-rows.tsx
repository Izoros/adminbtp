"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

/**
 * Saisie des décisions d'un compte-rendu, ligne par ligne : chacune porte son propre lot (pour
 * cibler les titulaires lors de la diffusion), son organisation assignée et son échéance — plus
 * un formulaire unique appliqué à tout le lot de décisions. Les champs sont nommés
 * decisionText_{i}/decisionLotId_{i}/decisionOrganizationId_{i}/decisionDueDate_{i}, lus par
 * createMeetingNote via le compteur caché decisionRowCount.
 */
export function DecisionRows({
  lots,
  organizations,
}: {
  lots: { id: string; number: string }[];
  organizations: { id: string; legalName: string }[];
}) {
  const [rows, setRows] = useState<number[]>([0]);
  const [nextKey, setNextKey] = useState(1);

  return (
    <div className="space-y-2">
      <input type="hidden" name="decisionRowCount" value={rows.length} />
      <p className="text-xs text-graphite-500">Décisions — chacune crée une tâche existante</p>
      {rows.map((key, i) => (
        <div key={key} className="flex flex-wrap items-end gap-2 rounded-md border border-surface-border p-2">
          <div className="flex-1 min-w-[12rem]">
            <label className="mb-1 block text-xs text-graphite-500">Décision</label>
            <Input name={`decisionText_${i}`} className="h-8 w-full text-xs" placeholder="Relancer le BET structure" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-graphite-500">Lot concerné</label>
            <Select name={`decisionLotId_${i}`} className="h-8 w-28 text-xs" defaultValue="">
              <option value="">Aucun</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>{l.number}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-graphite-500">Assignée à</label>
            <Select name={`decisionOrganizationId_${i}`} className="h-8 w-40 text-xs" defaultValue="">
              <option value="">Organisation du chantier (défaut)</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.legalName}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-graphite-500">Échéance</label>
            <Input name={`decisionDueDate_${i}`} type="date" className="h-8 w-36 text-xs" />
          </div>
          {rows.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRows((r) => r.filter((k) => k !== key))}
              aria-label="Retirer cette décision"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          setRows((r) => [...r, nextKey]);
          setNextKey((k) => k + 1);
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter une décision
      </Button>
    </div>
  );
}
