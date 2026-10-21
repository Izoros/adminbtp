/**
 * Interface fournisseur IA — interchangeable (OpenAI, Anthropic, autre) pour ne jamais
 * verrouiller le cœur métier. Toute sortie IA à portée technique (préédition PPSPS,
 * classification de mail, analyse de document) reste soumise à validation humaine.
 */
export interface AIClassificationResult {
  label: string;
  confidence: number;
}

export interface IAIProvider {
  classifyMailUrgency(subject: string, body: string): Promise<AIClassificationResult>;
  draftReply(context: string): Promise<string>;
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
}
