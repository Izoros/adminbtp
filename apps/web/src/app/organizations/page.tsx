import { createClient } from "@/lib/supabase/server";
import { ModulePageFrame } from "@/components/layout/module-page-frame";
import { createOrganizationAction } from "@/app/organizations/actions";
import { OrganizationAccessPanel } from "@/modules/organizations/components/organization-access-panel";
import { loadOrganizationAccessData } from "@/modules/organizations/services/organization-source";
import { getOrganizationFeedbackFromSearchParams } from "@/modules/organizations/services/organization-write";

type OrganizationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationsPage({ searchParams }: OrganizationsPageProps) {
  const supabase = await createClient();
  const accessData = await loadOrganizationAccessData(supabase);
  const resolvedSearchParams = (await searchParams) ?? {};
  const feedback = getOrganizationFeedbackFromSearchParams(resolvedSearchParams);

  return (
    <ModulePageFrame>
      <OrganizationAccessPanel
        user={accessData.user}
        organizations={accessData.organizations}
        memberships={accessData.memberships}
        source={accessData.source}
        sourceDetail={accessData.sourceDetail}
        feedback={feedback}
        createOrganizationAction={createOrganizationAction}
      />
    </ModulePageFrame>
  );
}
