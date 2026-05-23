import { AiGovernanceBoard } from "@/modules/ai/components/ai-governance-board";
import { buildInitialAiMutationState } from "@/modules/ai/services/ai-action-state";
import {
  applyAiSuggestionAction,
  reviewAiSuggestionAction,
} from "@/modules/ai/services/ai-actions";
import { loadAiGovernanceData } from "@/modules/ai/services/ai-data";
import { createClient } from "@/lib/supabase/server";

export default async function AiPage() {
  const supabase = await createClient();
  const data = await loadAiGovernanceData(supabase);

  async function reviewSuggestionAction(formData: FormData) {
    "use server";

    await reviewAiSuggestionAction(buildInitialAiMutationState(), formData);
  }

  async function applySuggestionAction(formData: FormData) {
    "use server";

    await applyAiSuggestionAction(buildInitialAiMutationState(), formData);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <AiGovernanceBoard
          data={data}
          reviewSuggestionAction={reviewSuggestionAction}
          applySuggestionAction={applySuggestionAction}
        />
      </div>
    </main>
  );
}
