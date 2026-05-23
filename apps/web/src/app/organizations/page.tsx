import { createClient } from "@/lib/supabase/server";
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <OrganizationAccessPanel
          user={accessData.user}
          organizations={accessData.organizations}
          memberships={accessData.memberships}
          source={accessData.source}
          sourceDetail={accessData.sourceDetail}
          feedback={feedback}
          createOrganizationAction={createOrganizationAction}
        />
      </div>
    </main>
  );
}
