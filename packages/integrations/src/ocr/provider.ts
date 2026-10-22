/**
 * Interface fournisseur OCR — interchangeable, pour l'extraction de pièces de marché (CCAP/CCTP/
 * DPGF/BPU) en clauses structurées et lignes de prix. Aucune valeur extraite n'a de portée
 * contractuelle avant validation humaine : tout ce qui est retourné ici doit être écrit en statut
 * `EXTRAIT`, jamais `VALIDE` directement (voir packages/types/src/market.ts).
 */
export interface ExtractedClause {
  kind: "DELAI_PAIEMENT" | "RETENUE_GARANTIE" | "ACTUALISATION" | "PENALITE" | "AVANCE" | "AUTRE";
  payload: Record<string, unknown>;
}

export interface ExtractedPriceLine {
  code: string;
  label: string;
  unit: string;
  quantityMarket: number;
  unitPriceHt: number;
}

export interface MarketExtractionResult {
  clauses: ExtractedClause[];
  priceLines: ExtractedPriceLine[];
}

export interface IOcrProvider {
  extractMarketPieces(sourceDocumentId: string, category: string): Promise<MarketExtractionResult>;
}

export class DemoOcrProvider implements IOcrProvider {
  async extractMarketPieces(sourceDocumentId: string, category: string): Promise<MarketExtractionResult> {
    console.warn(
      `[DEMO] Extraction OCR simulée pour le document ${sourceDocumentId} (${category}) — aucun I/O réseau, extrait fixe.`
    );
    return {
      clauses: [
        {
          kind: "DELAI_PAIEMENT",
          payload: { note: "Extrait simulé en mode démonstration — à valider par un humain." },
        },
      ],
      priceLines: [
        {
          code: "DEMO-001",
          label: "Ligne extraite en mode démonstration",
          unit: "u",
          quantityMarket: 1,
          unitPriceHt: 0,
        },
      ],
    };
  }
}
