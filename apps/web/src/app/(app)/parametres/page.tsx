import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import { getOrganizations } from "@/lib/data/organizations";
import { getDocumentTemplates } from "@/lib/data/documents";
import {
  getActiveOrganizationIdCookie,
  resolveActiveOrganization,
} from "@/lib/data/organization-context";
import { getOrganizationProfile, getOrganizationTrades } from "@/lib/data/organization-profile";
import { getTradeCodes } from "@/lib/data/trades";
import { getOrganizationCredentials } from "@/lib/data/credentials";
import {
  DOCUMENT_CATEGORY_LABELS,
  LegalKind,
  LEGAL_KIND_LABELS,
  OrganizationSizeBand,
  ORGANIZATION_SIZE_BAND_LABELS,
  MissionRole,
  MISSION_ROLE_LABELS,
  TRADE_FAMILY_LABELS,
  CredentialKind,
  CREDENTIAL_KIND_LABELS,
  CREDENTIAL_STATUS_LABELS,
} from "@adminbtp/types";
import { updateOrganizationProfile } from "@/lib/actions/organizations";
import { saveOrganizationProfile, saveOrganizationTrades } from "@/lib/actions/organization-profile";
import { saveOrganizationCredential } from "@/lib/actions/credentials";
import { MfaSettingsCard } from "@/components/settings/mfa-settings-card";

const VALIDATION_CIRCUIT = [
  { step: "Préparation", responsible: "Chargé d'affaires" },
  { step: "Contrôle gestionnaire", responsible: "Gestionnaire administratif" },
  { step: "Validation dirigeant", responsible: "Dirigeant" },
  { step: "Signature", responsible: "Signataire habilité (hors WhatsApp)" },
  { step: "Envoi", responsible: "Gestionnaire administratif" },
  { step: "Archivage", responsible: "Automatique" },
];

const INTEGRATIONS = [
  { name: "Odoo", status: "Non connecté", description: "Adaptateur JSON-2 API — synchronisation non bloquante" },
  { name: "Email (générique)", status: "Mode démo", description: "Boîtes génériques des sociétés clientes" },
  { name: "WhatsApp Business", status: "Mode démo", description: "Preuve d'échange — ne vaut pas signature électronique" },
  { name: "IA (génération de documents)", status: "Mode démo", description: "Fournisseur interchangeable" },
  { name: "n8n (automatisations)", status: "Non connecté", description: "Orchestration des workflows multi-outils" },
];

export default async function ParametresPage() {
  const [organizations, activeOrgCookie] = await Promise.all([
    getOrganizations(),
    getActiveOrganizationIdCookie(),
  ]);
  const activeOrg = resolveActiveOrganization(organizations, activeOrgCookie);
  const [organizationProfile, organizationTrades, tradeCodes, credentials] = activeOrg
    ? await Promise.all([
        getOrganizationProfile(activeOrg.id),
        getOrganizationTrades(activeOrg.id),
        getTradeCodes(),
        getOrganizationCredentials(activeOrg.id),
      ])
    : [null, [], [], []];
  const selectedTradeCodeIds = new Set(organizationTrades.map((t) => t.tradeCodeId));
  const primaryTradeCodeId = organizationTrades.find((t) => t.isPrimary)?.tradeCodeId;
  const tradeCodesById = new Map(tradeCodes.map((t) => [t.id, t.code]));
  const organizationTradeCodes = organizationTrades
    .map((t) => tradeCodesById.get(t.tradeCodeId))
    .filter((code): code is string => Boolean(code));
  const documentTemplates = activeOrg
    ? await getDocumentTemplates(activeOrg.id, {
        legalKind: organizationProfile?.legalKind,
        tradeCodes: organizationTradeCodes,
      })
    : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Organisation, modèles de documents, circuits de validation et intégrations" />

      <Card>
        <CardHeader>
          <CardTitle>Sécurité du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <MfaSettingsCard />
        </CardContent>
      </Card>

      {!activeOrg ? (
        <EmptyState icon={Building2} title="Aucune organisation accessible" />
      ) : (
        <Tabs
          defaultKey="organisation"
          tabs={[
            {
              key: "organisation",
              label: "Organisation",
              content: (
                <Card>
                  <CardHeader>
                    <CardTitle>Profil de l&apos;organisation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form action={updateOrganizationProfile.bind(null, activeOrg.id)} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="legalName" className="mb-1 block text-xs font-medium text-graphite-500">
                            Raison sociale
                          </label>
                          <Input id="legalName" name="legalName" defaultValue={activeOrg.legalName} required />
                        </div>
                        <div>
                          <label htmlFor="siret" className="mb-1 block text-xs font-medium text-graphite-500">
                            SIRET
                          </label>
                          <Input id="siret" name="siret" defaultValue={activeOrg.siret ?? ""} />
                        </div>
                        <div>
                          <label htmlFor="city" className="mb-1 block text-xs font-medium text-graphite-500">
                            Ville
                          </label>
                          <Input id="city" name="city" defaultValue={activeOrg.city ?? ""} />
                        </div>
                        <div>
                          <label htmlFor="postalCode" className="mb-1 block text-xs font-medium text-graphite-500">
                            Code postal
                          </label>
                          <Input id="postalCode" name="postalCode" defaultValue={activeOrg.postalCode ?? ""} />
                        </div>
                      </div>
                      <Button type="submit" variant="secondary" size="sm">
                        Enregistrer
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ),
            },
            {
              key: "profil-metier",
              label: "Profil métier",
              content: (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Forme et rôle par défaut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-xs text-graphite-500">
                        Ne crée aucun droit — sert de défaut à l&apos;onboarding et au pré-filtre des
                        modèles et lots proposés. Le rôle effectif sur un chantier reste toujours celui
                        défini dans l&apos;onglet Intervenants de ce chantier.
                      </p>
                      <form action={saveOrganizationProfile} className="space-y-4">
                        <input type="hidden" name="organizationId" value={activeOrg.id} />
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label htmlFor="legalKind" className="mb-1 block text-xs font-medium text-graphite-500">
                              Forme juridique / métier
                            </label>
                            <Select
                              id="legalKind"
                              name="legalKind"
                              defaultValue={organizationProfile?.legalKind ?? ""}
                              required
                            >
                              <option value="" disabled>
                                Sélectionner…
                              </option>
                              {LegalKind.options.map((kind) => (
                                <option key={kind} value={kind}>
                                  {LEGAL_KIND_LABELS[kind]}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label htmlFor="sizeBand" className="mb-1 block text-xs font-medium text-graphite-500">
                              Taille
                            </label>
                            <Select id="sizeBand" name="sizeBand" defaultValue={organizationProfile?.sizeBand ?? ""}>
                              <option value="">Non renseignée</option>
                              {OrganizationSizeBand.options.map((band) => (
                                <option key={band} value={band}>
                                  {ORGANIZATION_SIZE_BAND_LABELS[band]}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-graphite-500">
                            Rôles chantier par défaut proposés à l&apos;onboarding
                          </p>
                          <div className="grid gap-1.5 md:grid-cols-3">
                            {MissionRole.options.map((role) => (
                              <label key={role} className="flex items-center gap-2 text-sm text-graphite-900">
                                <input
                                  type="checkbox"
                                  name="defaultMissionRoles"
                                  value={role}
                                  defaultChecked={organizationProfile?.defaultMissionRoles.includes(role)}
                                  className="h-4 w-4 rounded border-surface-border"
                                />
                                {MISSION_ROLE_LABELS[role]}
                              </label>
                            ))}
                          </div>
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                          Enregistrer le profil
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Corps d&apos;état pratiqués</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form action={saveOrganizationTrades} className="space-y-4">
                        <input type="hidden" name="organizationId" value={activeOrg.id} />
                        {Object.entries(TRADE_FAMILY_LABELS).map(([family, familyLabel]) => {
                          const familyTrades = tradeCodes.filter((t) => t.family === family);
                          if (familyTrades.length === 0) return null;
                          return (
                            <div key={family}>
                              <p className="mb-1 text-xs font-medium text-graphite-500">{familyLabel}</p>
                              <div className="grid gap-1.5 md:grid-cols-3">
                                {familyTrades.map((trade) => (
                                  <label key={trade.id} className="flex items-center gap-2 text-sm text-graphite-900">
                                    <input
                                      type="checkbox"
                                      name="tradeCodeIds"
                                      value={trade.id}
                                      defaultChecked={selectedTradeCodeIds.has(trade.id)}
                                      className="h-4 w-4 rounded border-surface-border"
                                    />
                                    {trade.label}
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        <div>
                          <label htmlFor="primaryTradeCodeId" className="mb-1 block text-xs font-medium text-graphite-500">
                            Métier principal
                          </label>
                          <Select id="primaryTradeCodeId" name="primaryTradeCodeId" defaultValue={primaryTradeCodeId ?? ""}>
                            <option value="">Aucun</option>
                            {tradeCodes.map((trade) => (
                              <option key={trade.id} value={trade.id}>
                                {trade.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                          Enregistrer les métiers
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pièces d&apos;entreprise</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-graphite-500">
                        Préfiltre les lots et sous-traitances proposables, ne crée aucun droit en soi.
                        Une échéance dépassée s&apos;affiche toujours comme expirée, quel que soit le
                        statut déclaré.
                      </p>
                      {credentials.length === 0 ? (
                        <p className="text-sm text-graphite-500">Aucune pièce déclarée.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="text-left text-xs uppercase text-graphite-500">
                            <tr>
                              <th className="py-1">Type</th>
                              <th>Échéance</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border">
                            {credentials.map((c) => {
                              const isExpired = c.expiresOn && c.expiresOn < today;
                              return (
                                <tr key={c.id}>
                                  <td className="py-1.5">{CREDENTIAL_KIND_LABELS[c.kind]}</td>
                                  <td>{c.expiresOn ?? "—"}</td>
                                  <td>
                                    <Badge tone={isExpired ? "danger" : c.status === "VALIDE" ? "success" : "neutral"}>
                                      {isExpired ? "Expirée" : CREDENTIAL_STATUS_LABELS[c.status]}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                      <form action={saveOrganizationCredential} className="flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                        <input type="hidden" name="organizationId" value={activeOrg.id} />
                        <div>
                          <label className="mb-1 block text-xs text-graphite-500">Type de pièce</label>
                          <Select name="kind" className="h-8 w-48 text-xs" required defaultValue="">
                            <option value="" disabled>Choisir…</option>
                            {CredentialKind.options.map((kind) => (
                              <option key={kind} value={kind}>{CREDENTIAL_KIND_LABELS[kind]}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-graphite-500">Échéance</label>
                          <Input type="date" name="expiresOn" className="h-8 w-36 text-xs" />
                        </div>
                        <Button type="submit" size="sm" variant="secondary">Déclarer</Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              ),
            },
            {
              key: "documents",
              label: "Modèles de documents",
              content: (
                <div className="space-y-2">
                  <p className="text-xs text-graphite-500">
                    Filtré selon la forme juridique et les corps d&apos;état du profil (onglet
                    &quot;Profil métier&quot;) — un modèle sans tag d&apos;audience reste toujours visible.
                  </p>
                  <Card className="overflow-hidden">
                    {documentTemplates.length === 0 ? (
                      <EmptyState icon={Building2} title="Aucun modèle de document" className="border-none" />
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                          <tr>
                            <th className="px-4 py-2.5">Modèle</th>
                            <th className="px-4 py-2.5">Catégorie</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {documentTemplates.map((tpl) => (
                            <tr key={tpl.id} className="hover:bg-surface-subtle">
                              <td className="px-4 py-3 font-medium text-graphite-900">{tpl.name}</td>
                              <td className="px-4 py-3 text-graphite-700">{DOCUMENT_CATEGORY_LABELS[tpl.category]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: "validations",
              label: "Circuit de validation",
              content: (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-subtle text-left text-xs font-medium uppercase tracking-wide text-graphite-500">
                      <tr>
                        <th className="px-4 py-2.5">Étape</th>
                        <th className="px-4 py-2.5">Responsable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {VALIDATION_CIRCUIT.map((row) => (
                        <tr key={row.step} className="hover:bg-surface-subtle">
                          <td className="px-4 py-3 font-medium text-graphite-900">{row.step}</td>
                          <td className="px-4 py-3 text-graphite-700">{row.responsible}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ),
            },
            {
              key: "integrations",
              label: "Intégrations",
              content: (
                <div className="space-y-2">
                  {INTEGRATIONS.map((integ) => (
                    <Card key={integ.name} className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium text-graphite-900">{integ.name}</p>
                        <p className="text-xs text-graphite-500">{integ.description}</p>
                      </div>
                      <Badge tone={integ.status === "Mode démo" ? "warning" : "neutral"}>{integ.status}</Badge>
                    </Card>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
