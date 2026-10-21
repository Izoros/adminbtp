import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { USER_PERMISSION_LABELS } from "@adminbtp/types";
import { mockOrganizations, mockSites, USERS } from "@/lib/mock-data";

export default function PortefeuillePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Portefeuille des gestionnaires"
        description="Autorisations de supervision multi-sociétés des collaborateurs AdminBTP"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {USERS.map((user) => {
          const sites = mockSites.filter((s) => s.managerUserId === user.id);
          const orgIds = Array.from(new Set(sites.map((s) => s.organizationId)));
          const orgs = mockOrganizations.filter((o) => orgIds.includes(o.id));

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-night-800 text-xs font-semibold text-white">
                    {user.initials}
                  </div>
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <p className="text-xs text-graphite-500">{USER_PERMISSION_LABELS[user.permissionRole]}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-graphite-500">
                    Sociétés supervisées ({orgs.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {orgs.map((o) => (
                      <Badge key={o.id} tone="info">{o.name}</Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-graphite-500">{sites.length} chantier(s) référent(s)</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
