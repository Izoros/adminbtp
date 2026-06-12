import { ModulePageFrame } from "@/components/layout/module-page-frame";
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
    <ModulePageFrame>
      <OdooMappingBoard
        initialData={odooMappingBoardData}
        upsertMappingAction={upsertMappingPageAction}
      />
    </ModulePageFrame>
  );
}
