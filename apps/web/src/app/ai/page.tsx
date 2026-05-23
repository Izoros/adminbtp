import { revalidatePath } from "next/cache";

import { AiGovernanceBoard } from "@/modules/ai/components/ai-governance-board";
import { loadAiGovernanceData } from "@/modules/ai/services/ai-data";
import { normalizeSuggestionReviewDecision } from "@/modules/ai/services/ai-governance";
import { createClient } from "@/lib/supabase/server";

export default async function AiPage() {
  const supabase = await createClient();
  const data = await loadAiGovernanceData(supabase);

  async function reviewSuggestionAction(formData: FormData) {
    "use server";

    const supabaseClient = await createClient();

    if (!supabaseClient || data.source !== "supabase") {
      return;
    }

    const suggestionId = formData.get("suggestionId")?.toString();
    const decision = normalizeSuggestionReviewDecision(
      formData.get("decision")?.toString(),
    );
    const targetSuggestion = data.suggestions.find(
      (suggestion) => suggestion.id === suggestionId,
    );

    if (!suggestionId || !decision || !targetSuggestion) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return;
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseClient
      .from("ai_suggestions")
      .update({
        status: decision,
        validated_by: user.id,
        validated_at: now,
      })
      .eq("id", suggestionId)
      .eq("organization_id", targetSuggestion.organizationId);

    if (updateError) {
      return;
    }

    await supabaseClient.from("ai_suggestion_audit_logs").insert({
      ai_suggestion_id: suggestionId,
      actor_type: "user",
      actor_id: user.id,
      action: decision,
      details: {
        origin: "ai_page",
        message:
          decision === "approved"
            ? "Validation humaine depuis l'interface IA."
            : "Rejet humain depuis l'interface IA.",
      },
    });

    revalidatePath("/ai");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <AiGovernanceBoard
          data={data}
          reviewSuggestionAction={reviewSuggestionAction}
        />
      </div>
    </main>
  );
}
