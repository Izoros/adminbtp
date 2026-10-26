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

/** Entrée de génération d'un document à partir d'un modèle (DocumentTemplate) et de ses variables. */
export interface DocumentGenerationRequest {
  category: string;
  templateName: string;
  title: string;
  variables: Record<string, string>;
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
  /**
   * Rédige le corps texte d'un document à partir d'un modèle et de ses variables — jamais le
   * fichier final (rendu PDF fait par l'appelant) ni le statut (toujours décidé côté base/Server
   * Action, voir enforce_ppsps_preedition() pour le PPSPS). Un PPSPS généré ici reste une
   * préédition à adapter par une personne compétente, jamais une valeur contractuelle/sécurité
   * directement exploitable.
   */
  generateDocumentContent(request: DocumentGenerationRequest): Promise<string>;
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

  async generateDocumentContent(request: DocumentGenerationRequest): Promise<string> {
    console.warn(`[DEMO] Génération IA simulée pour "${request.title}" (${request.category}) — aucun appel réseau.`);
    const lines = Object.entries(request.variables).map(([key, value]) => `${key} : ${value}`);
    return [`${request.title} — document généré en mode démonstration.`, "", ...lines].join("\n");
  }
}

/**
 * Fournisseur réel via l'API DeepSeek (compatible OpenAI) — clé lue dans DEEPSEEK_API_KEY,
 * jamais en dur. Tant que la variable n'est pas définie, chaque appel échoue explicitement
 * plutôt que de retomber silencieusement sur une réponse simulée.
 */
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-chat";

async function deepseekChat(messages: { role: "system" | "user"; content: string }[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY absente — fournisseur IA DeepSeek non configuré.");
  }
  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages, temperature: 0.3 }),
  });
  if (!res.ok) {
    throw new Error(`Appel DeepSeek en échec (${res.status}) : ${await res.text()}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message.content?.trim() ?? "";
}

export class DeepSeekAIProvider implements IAIProvider {
  async classifyMailUrgency(subject: string, body: string): Promise<AIClassificationResult> {
    const content = await deepseekChat([
      {
        role: "system",
        content:
          'Classe l\'urgence d\'un mail BTP en NORMALE, URGENTE ou CRITIQUE. Réponds strictement en JSON {"label": "...", "confidence": 0-1}, sans texte autour.',
      },
      { role: "user", content: `Sujet : ${subject}\n\n${body}` },
    ]);
    const parsed = JSON.parse(content) as { label: string; confidence: number };
    return { label: parsed.label, confidence: parsed.confidence };
  }

  async draftReply(context: string): Promise<string> {
    return deepseekChat([
      {
        role: "system",
        content:
          "Rédige un brouillon de réponse professionnelle en français pour une organisation du BTP. Ce brouillon sera toujours relu et validé par un humain avant tout envoi.",
      },
      { role: "user", content: context },
    ]);
  }

  async reviewDocument(category: string, title: string): Promise<DocumentReviewResult> {
    const content = await deepseekChat([
      {
        role: "system",
        content:
          'Contrôle préalable (avant relecture humaine) d\'un document BTP. Réponds strictement en JSON {"verdict": "OK"|"ECARTS"|"INSUFFISANT", "findings": {...}}, sans texte autour.',
      },
      { role: "user", content: `Catégorie : ${category}\nTitre : ${title}` },
    ]);
    return JSON.parse(content) as DocumentReviewResult;
  }

  async suggestMailFiling(subject: string, body: string): Promise<MailFilingSuggestion> {
    const content = await deepseekChat([
      {
        role: "system",
        content:
          'Suggère une catégorie de classement pour ce mail BTP (ex: DC4, SITUATION_TRAVAUX, RESERVES, DOE, PPSPS) ou null si aucune ne convient. Réponds strictement en JSON {"suggestedCategory": "..."|null, "confidence": 0-1}, sans texte autour. Ne propose jamais de lot : il n\'est pas dans ce contexte.',
      },
      { role: "user", content: `Sujet : ${subject}\n\n${body}` },
    ]);
    return JSON.parse(content) as MailFilingSuggestion;
  }

  async generateDocumentContent(request: DocumentGenerationRequest): Promise<string> {
    const variableLines = Object.entries(request.variables)
      .map(([key, value]) => `- ${key} : ${value}`)
      .join("\n");
    return deepseekChat([
      {
        role: "system",
        content:
          "Rédige le corps texte d'un document administratif BTP en français, structuré et professionnel, à partir du modèle et des variables fournies. Ne produis que le texte du document, sans commentaire ni markdown.",
      },
      {
        role: "user",
        content: `Modèle : ${request.templateName}\nCatégorie : ${request.category}\nTitre : ${request.title}\nVariables :\n${variableLines}`,
      },
    ]);
  }
}

/** DeepSeekAIProvider si DEEPSEEK_API_KEY est définie, DemoAIProvider sinon — jamais d'I/O réseau sans clé. */
export function getAIProvider(): IAIProvider {
  return process.env.DEEPSEEK_API_KEY ? new DeepSeekAIProvider() : new DemoAIProvider();
}
