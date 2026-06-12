import { ModulePageFrame } from "@/components/layout/module-page-frame";
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
    <ModulePageFrame>
      <AiGovernanceBoard
        data={data}
        reviewSuggestionAction={reviewSuggestionAction}
        applySuggestionAction={applySuggestionAction}
      />
    </ModulePageFrame>
  );
}
