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

export interface IAIProvider {
  classifyMailUrgency(subject: string, body: string): Promise<AIClassificationResult>;
  draftReply(context: string): Promise<string>;
  /**
   * Contrôle IA d'un document avant relecture humaine. Ne fait jamais passer un document au-delà
   * de EN_CONTROLE côté appelant — seul un humain (VALIDATEUR, ou l'action de validation
   * existante) peut faire passer un document à VALIDE.
   */
  reviewDocument(category: string, title: string): Promise<DocumentReviewResult>;
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
}
