import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { redirect } from "next/navigation";
import { OdooMappingBoard } from "@/modules/settings/components/odoo-mapping-board";
import { buildInitialOdooMutationState } from "@/modules/settings/services/odoo-action-state";
import { upsertOdooMappingAction } from "@/modules/settings/services/odoo-actions";
import { getOdooMappingBoardData } from "@/modules/settings/services/supabase-odoo-data";

type OdooPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    result?: string;
  }>;
};

export default async function OdooPage({ searchParams }: OdooPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const odooMappingBoardData = await getOdooMappingBoardData({
    organizationId: resolvedSearchParams?.organizationId,
  });

  async function upsertMappingPageAction(formData: FormData) {
    "use server";

    const result = await upsertOdooMappingAction(
      buildInitialOdooMutationState(),
      formData,
    );
    const organizationId = formData.get("organizationId");
    const params = new URLSearchParams({ result: result.status });

    if (typeof organizationId === "string" && organizationId.trim()) {
      params.set("organizationId", organizationId.trim());
    }

    redirect(`/odoo?${params.toString()}`);
  }

  const feedback =
    resolvedSearchParams?.result === "success"
      ? {
          status: "success" as const,
          message: "Le mapping Odoo a ete enregistre et sera utilise apres validation de la connexion.",
        }
      : resolvedSearchParams?.result === "error"
        ? {
            status: "error" as const,
            message:
              "Le mapping Odoo n'a pas ete enregistre. Verifiez la session, l'organisation et les identifiants.",
          }
        : undefined;

  return (
    <ModulePageFrame>
      <OdooMappingBoard
        feedback={feedback}
        initialData={odooMappingBoardData}
        upsertMappingAction={upsertMappingPageAction}
      />
    </ModulePageFrame>
  );
}
