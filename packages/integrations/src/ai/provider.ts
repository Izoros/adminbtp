/**
 * Interface fournisseur IA — interchangeable (OpenAI, Anthropic, autre) pour ne jamais
 * verrouiller le cœur métier. Toute sortie IA à portée technique (préédition PPSPS,
 * classification de mail, analyse de document) reste soumise à validation humaine.
 */
export interface AIClassificationResult {
  label: string;
  confidence: number;
}

export interface DocumentReviewResult {
  verdict: "OK" | "ECARTS" | "INSUFFISANT";
  findings: Record<string, unknown>;
}

export interface MailFilingSuggestion {
  suggestedCategory: string | null; // code DocumentCategory, ex: "DC4" — jamais appliqué sans confirmation humaine
  confidence: number;
}

export interface IAIProvider {
  classifyMailUrgency(subject: string, body: string): Promise<AIClassificationResult>;
  draftReply(context: string): Promise<string>;
  /**
   * Contrôle IA d'un document avant relecture humaine. Ne fait jamais passer un document au-delà
   * de EN_CONTROLE côté appelant — seul un humain (VALIDATEUR, ou l'action de validation
   * existante) peut faire passer un document à VALIDE.
   */
  reviewDocument(category: string, title: string): Promise<DocumentReviewResult>;
  /**
   * Suggère une catégorie de document pour classer un mail déjà lié à un chantier — jamais le
   * lot (l'IA n'a pas le contexte des lots réels du chantier, choisi par l'humain). Une simple
   * proposition à confirmer, jamais appliquée automatiquement.
   */
  suggestMailFiling(subject: string, body: string): Promise<MailFilingSuggestion>;
}

export class DemoAIProvider implements IAIProvider {
  async classifyMailUrgency(subject: string): Promise<AIClassificationResult> {
    console.warn(`[DEMO] Classification IA simulée pour: "${subject}"`);
    return { label: "NORMALE", confidence: 0.5 };
  }

  async draftReply(context: string): Promise<string> {
    console.warn(`[DEMO] Brouillon IA simulé (non envoyé), contexte: "${context.slice(0, 60)}..."`);
    return "Brouillon de réponse généré en mode démonstration — à relire avant tout envoi.";
  }

  async reviewDocument(category: string, title: string): Promise<DocumentReviewResult> {
    console.warn(`[DEMO] Contrôle IA simulé pour "${title}" (${category}) — aucun appel réseau.`);
    return {
      verdict: "ECARTS",
      findings: {
        note: "Contrôle simulé en mode démonstration — à vérifier par un humain.",
        category,
      },
    };
  }

  async suggestMailFiling(subject: string, body: string): Promise<MailFilingSuggestion> {
    console.warn(`[DEMO] Suggestion de classement simulée pour: "${subject}" — aucun appel réseau.`);
    const text = `${subject} ${body}`.toLowerCase();
    const rules: Array<{ keywords: string[]; category: string }> = [
      { keywords: ["dc4", "sous-traitant", "sous traitant"], category: "DC4" },
      { keywords: ["situation", "décompte", "facture"], category: "SITUATION_TRAVAUX" },
      { keywords: ["réserve", "reserve"], category: "RESERVES" },
      { keywords: ["doe", "dossier des ouvrages"], category: "DOE" },
      { keywords: ["ppsps", "sécurité", "prévention"], category: "PPSPS" },
    ];
    const match = rules.find((rule) => rule.keywords.some((kw) => text.includes(kw)));
    return match
      ? { suggestedCategory: match.category, confidence: 0.6 }
      : { suggestedCategory: null, confidence: 0 };
  }
}
