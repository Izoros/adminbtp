import { Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { USER_PERMISSION_LABELS } from "@adminbtp/types";
import { getOrganizations } from "@/lib/data/organizations";
import { getSites } from "@/lib/data/sites";
import { getPlatformUsers, getPortfolio } from "@/lib/data/users";
import { getAllPortfolioGrants } from "@/lib/data/portfolio-grants";
import { grantPortfolioAccess, revokePortfolioAccess } from "@/lib/actions/portfolio-grants";

export default async function PortefeuillePage() {
  const [organizations, sites, portfolio, platformUsers, grants] = await Promise.all([
    getOrganizations(),
    getSites(),
    getPortfolio(),
    getPlatformUsers(),
    getAllPortfolioGrants(),
  ]);

  const orgName = (id: string) => organizations.find((o) => o.id === id)?.name ?? id;
  const userName = (id: string) => platformUsers.find((u) => u.id === id)?.fullName ?? id;
  const activeGrants = grants.filter((g) => !g.revokedAt);
  const revokedGrants = grants.filter((g) => g.revokedAt);

  const overviewTab = (
    <div className="grid gap-4 md:grid-cols-2">
      {portfolio.map((user) => {
        const userSites = sites.filter((s) => s.managerUserId === user.id);
        const orgs = organizations.filter((o) => user.organizationIds.includes(o.id));

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
              <p className="text-xs text-graphite-500">{userSites.length} chantier(s) référent(s)</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const accessTab = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attribuer un accès cross-organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-graphite-500">
            Réservé à un Super Administrateur ou un Responsable portefeuille — la Row Level Security
            refuse l&apos;insertion pour tout autre rôle, quel que soit le contenu de ce formulaire.
          </p>
          <form action={grantPortfolioAccess} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-graphite-500">Collaborateur AdminBTP</label>
              <Select name="userId" className="h-8 w-56 text-xs" required defaultValue="">
                <option value="" disabled>Choisir…</option>
                {platformUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-graphite-500">Organisation cliente</label>
              <Select name="organizationId" className="h-8 w-56 text-xs" required defaultValue="">
                <option value="" disabled>Choisir…</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" size="sm" variant="accent">Attribuer</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Accès actifs ({activeGrants.length})</h2>
        {activeGrants.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Aucun accès cross-organisation actif" />
        ) : (
          <div className="space-y-2">
            {activeGrants.map((grant) => (
              <Card key={grant.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-graphite-900">
                      {userName(grant.userId)} → {orgName(grant.organizationId)}
                    </p>
                    <p className="text-xs text-graphite-500">
                      Attribué par {userName(grant.grantedBy)} le{" "}
                      {new Date(grant.grantedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge tone="success">Actif</Badge>
                </div>
                <form action={revokePortfolioAccess} className="mt-3">
                  <input type="hidden" name="grantId" value={grant.id} />
                  <Button type="submit" size="sm" variant="danger">Révoquer</Button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Révoqués ({revokedGrants.length})</h2>
        <Card className="overflow-hidden">
          {revokedGrants.length === 0 ? (
            <EmptyState icon={UsersIcon} title="Aucun historique de révocation" className="border-none" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                <tr>
                  <th className="px-4 py-2.5">Collaborateur</th>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Attribué</th>
                  <th className="px-4 py-2.5">Révoqué</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {revokedGrants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 font-medium text-graphite-900">{userName(grant.userId)}</td>
                    <td className="px-4 py-3 text-graphite-700">{orgName(grant.organizationId)}</td>
                    <td className="px-4 py-3 text-xs text-graphite-500">
                      {userName(grant.grantedBy)} — {new Date(grant.grantedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-xs text-graphite-500">
                      <Badge tone="danger">Révoqué</Badge>{" "}
                      {grant.revokedBy ? userName(grant.revokedBy) : "—"} le{" "}
                      {grant.revokedAt ? new Date(grant.revokedAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portefeuille des gestionnaires"
        description="Autorisations de supervision multi-sociétés des collaborateurs AdminBTP"
      />

      <Tabs
        defaultKey="overview"
        tabs={[
          { key: "overview", label: "Vue d'ensemble", content: overviewTab },
          { key: "access", label: `Accès cross-organisation (${activeGrants.length})`, content: accessTab },
        ]}
      />
    </div>
  );
}
