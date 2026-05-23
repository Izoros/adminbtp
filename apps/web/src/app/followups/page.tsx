import { getFollowupFeedbackFromSearchParams } from "@/modules/followups/services/followup-actions";
import { getFollowupDashboardData } from "@/modules/followups/services/supabase-followup-data";
import { FollowupDashboard } from "@/modules/followups/components/followup-dashboard";

type FollowupsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> & {
    organizationId?: string;
    projectId?: string;
    situationId?: string;
  }>;
};

export default async function FollowupsPage({ searchParams }: FollowupsPageProps) {
  const resolvedSearchParams = (searchParams ? await searchParams : undefined) ?? {};
  const followupDashboardData = await getFollowupDashboardData({
    organizationId: resolvedSearchParams?.organizationId,
    projectId: resolvedSearchParams?.projectId,
    situationId: resolvedSearchParams?.situationId,
  });
  const feedback = getFollowupFeedbackFromSearchParams(resolvedSearchParams);
  const currentPath = new URLSearchParams(
    Object.entries(resolvedSearchParams).flatMap(([key, value]) => {
      if (key.startsWith("followup")) {
        return [];
      }

      if (typeof value === "string") {
        return [[key, value]];
      }

      if (Array.isArray(value)) {
        return value.map((entry) => [key, entry]);
      }

      return [];
    }),
  ).toString();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe3d0_0%,#f7f4ee_38%,#f5f2ec_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <FollowupDashboard
          initialData={followupDashboardData}
          currentPath={currentPath.length > 0 ? `/followups?${currentPath}` : "/followups"}
          feedback={feedback}
        />
      </div>
    </main>
  );
}
