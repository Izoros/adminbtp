import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getOrganizations } from "@/lib/data/organizations";
import { getPlatformUsers } from "@/lib/data/users";
import { getActiveOrganizationIdCookie, resolveActiveOrganization } from "@/lib/data/organization-context";
import { createSite } from "@/lib/actions/sites";
import { SITE_STATUS_LABELS, SiteStatus } from "@adminbtp/types";

export default async function NouveauChantierPage() {
  const [organizations, users, activeOrgCookie] = await Promise.all([
    getOrganizations(),
    getPlatformUsers(),
    getActiveOrganizationIdCookie(),
  ]);
  const defaultOrg = resolveActiveOrganization(organizations, activeOrgCookie);

  return (
    <div className="space-y-6">
      <Link href="/chantiers" className="inline-flex items-center gap-1.5 text-sm text-graphite-500 hover:text-graphite-900">
        <ArrowLeft className="h-4 w-4" />
        Chantiers
      </Link>

      <PageHeader title="Nouveau chantier" description="Créer un chantier et le rattacher à une organisation cliente" />

      {organizations.length === 0 ? (
        <Card className="p-4 text-sm text-graphite-500">
          Aucune organisation accessible — impossible de créer un chantier.
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informations du chantier</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSite} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="organizationId" className="mb-1 block text-xs font-medium text-graphite-500">
                    Organisation *
                  </label>
                  <Select id="organizationId" name="organizationId" defaultValue={defaultOrg?.id} required>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="reference" className="mb-1 block text-xs font-medium text-graphite-500">
                    Référence *
                  </label>
                  <Input id="reference" name="reference" placeholder="2026-MDA-000" required />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-medium text-graphite-500">
                  Nom du chantier *
                </label>
                <Input id="name" name="name" placeholder="Réhabilitation collège de Kawéni" required />
              </div>

              <div>
                <label htmlFor="address" className="mb-1 block text-xs font-medium text-graphite-500">
                  Adresse *
                </label>
                <Input id="address" name="address" placeholder="Route de Kawéni" required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="city" className="mb-1 block text-xs font-medium text-graphite-500">
                    Ville *
                  </label>
                  <Input id="city" name="city" placeholder="Mamoudzou" required />
                </div>
                <div>
                  <label htmlFor="postalCode" className="mb-1 block text-xs font-medium text-graphite-500">
                    Code postal
                  </label>
                  <Input id="postalCode" name="postalCode" placeholder="97600" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="status" className="mb-1 block text-xs font-medium text-graphite-500">
                    Statut
                  </label>
                  <Select id="status" name="status" defaultValue="ETUDE">
                    {SiteStatus.options.map((status) => (
                      <option key={status} value={status}>
                        {SITE_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="budgetHt" className="mb-1 block text-xs font-medium text-graphite-500">
                    Budget HT (€)
                  </label>
                  <Input id="budgetHt" name="budgetHt" type="number" min="0" step="1" placeholder="1850000" />
                </div>
                <div>
                  <label htmlFor="managerUserId" className="mb-1 block text-xs font-medium text-graphite-500">
                    Gestionnaire référent
                  </label>
                  <Select id="managerUserId" name="managerUserId" defaultValue="">
                    <option value="">Aucun</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="mb-1 block text-xs font-medium text-graphite-500">
                    Date de début
                  </label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div>
                  <label htmlFor="endDateEstimated" className="mb-1 block text-xs font-medium text-graphite-500">
                    Fin prévue
                  </label>
                  <Input id="endDateEstimated" name="endDateEstimated" type="date" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="accent">
                  Créer le chantier
                </Button>
                <Link href="/chantiers">
                  <Button type="button" variant="secondary">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
