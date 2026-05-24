import { OdooMappingBoard } from "@/modules/settings/components/odoo-mapping-board";
import { buildInitialOdooMutationState } from "@/modules/settings/services/odoo-action-state";
import { upsertOdooMappingAction } from "@/modules/settings/services/odoo-actions";
import { getOdooMappingBoardData } from "@/modules/settings/services/supabase-odoo-data";

type OdooPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
  }>;
};

export default async function OdooPage({ searchParams }: OdooPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const odooMappingBoardData = await getOdooMappingBoardData({
    organizationId: resolvedSearchParams?.organizationId,
  });

  async function upsertMappingPageAction(formData: FormData) {
    "use server";

    await upsertOdooMappingAction(buildInitialOdooMutationState(), formData);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <OdooMappingBoard
          initialData={odooMappingBoardData}
          upsertMappingAction={upsertMappingPageAction}
        />
      </div>
    </main>
  );
}
