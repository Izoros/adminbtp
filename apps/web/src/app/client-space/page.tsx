import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { ClientSpaceBoard } from "@/modules/client-space/components/client-space-board";
import {
  addCommentAction,
  submitWorkspaceDecisionAction,
} from "@/modules/client-space/services/client-space-actions";
import {
  loadClientSpaceData,
} from "@/modules/client-space/services/client-space-data";
import { createClient } from "@/lib/supabase/server";

export default async function ClientSpacePage() {
  const supabase = await createClient();
  const data = await loadClientSpaceData(supabase);

  async function addCommentPageAction(formData: FormData) {
    "use server";

    await addCommentAction(data, formData);
  }

  async function submitWorkspaceDecisionPageAction(formData: FormData) {
    "use server";

    await submitWorkspaceDecisionAction(data, formData);
  }

  return (
    <ModulePageFrame>
      <ClientSpaceBoard
        data={data}
        addCommentAction={addCommentPageAction}
        submitWorkspaceDecisionAction={submitWorkspaceDecisionPageAction}
      />
    </ModulePageFrame>
  );
}
