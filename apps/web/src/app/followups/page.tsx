import { getFollowupDashboardData } from "@/modules/followups/services/supabase-followup-data";
import { FollowupDashboard } from "@/modules/followups/components/followup-dashboard";

type FollowupsPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    projectId?: string;
    situationId?: string;
  }>;
};

export default async function FollowupsPage({ searchParams }: FollowupsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const followupDashboardData = await getFollowupDashboardData({
    organizationId: resolvedSearchParams?.organizationId,
    projectId: resolvedSearchParams?.projectId,
    situationId: resolvedSearchParams?.situationId,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <FollowupDashboard initialData={followupDashboardData} />
      </div>
    </main>
  );
}
