import { ClientSpaceBoard } from "@/modules/client-space/components/client-space-board";
import { addCommentAction } from "@/modules/client-space/services/client-space-actions";
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <ClientSpaceBoard data={data} addCommentAction={addCommentPageAction} />
      </div>
    </main>
  );
}
