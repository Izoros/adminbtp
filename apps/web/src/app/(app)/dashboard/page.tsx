import Link from "next/link";
import {
  Building2,
  HardHat,
  Mail,
  FileWarning,
  ShieldCheck,
  BellRing,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  mockOrganizations,
  mockSites,
  mockMailThreads,
  mockDocuments,
  mockValidations,
  mockSituations,
  USERS,
  mockTasks,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const activeOrganizations = mockOrganizations.length;
  const activeSites = mockSites.filter((s) => s.status === "EN_COURS" || s.status === "PREPARATION").length;
  const mailsToHandle = mockMailThreads.filter((m) => m.status === "NON_TRAITE" || m.status === "AFFECTE").length;
  const missingDocuments = mockDocuments.filter((d) => d.status === "BROUILLON" || d.status === "PREEDITION").length;
  const pendingValidations = mockValidations.filter((v) => !v.decision).length;
  const overdueSituations = mockSituations.filter((s) => s.status === "CONTESTE" || s.status === "EN_VERIFICATION").length;
  const pendingPayments = mockSituations.filter((s) => s.status !== "PAYE").length;

  const criticalAlerts = [
    ...mockMailThreads
      .filter((m) => m.urgency === "CRITIQUE" && m.status !== "CLOTURE")
      .map((m) => ({ id: m.id, label: `Mail critique : "${m.subject}"`, href: "/mails" })),
    ...mockTasks
      .filter((t) => t.priority === "CRITIQUE" && t.status !== "FAIT")
      .map((t) => ({ id: t.id, label: `Tâche critique : "${t.title}"`, href: "/taches" })),
    ...mockSituations
      .filter((s) => s.status === "CONTESTE")
      .map((s) => ({ id: s.id, label: `Situation n°${s.number} contestée`, href: "/relances" })),
  ];

  const loadByManager = USERS.map((u) => ({
    ...u,
    siteCount: mockSites.filter((s) => s.managerUserId === u.id).length,
    taskCount: mockTasks.filter((t) => t.assignedUserId === u.id && t.status !== "FAIT").length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-graphite-900">Tableau de bord</h1>
        <p className="text-sm text-graphite-500">Vue d&apos;ensemble du portefeuille — données de démonstration</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Clients actifs" value={activeOrganizations} icon={Building2} href="/organisations" />
        <KpiCard label="Chantiers actifs" value={activeSites} icon={HardHat} href="/chantiers" />
        <KpiCard label="Mails à traiter" value={mailsToHandle} icon={Mail} href="/mails" tone={mailsToHandle > 0 ? "warning" : "neutral"} />
        <KpiCard label="Documents manquants" value={missingDocuments} icon={FileWarning} href="/documents" tone={missingDocuments > 0 ? "warning" : "neutral"} />
        <KpiCard label="Validations en attente" value={pendingValidations} icon={ShieldCheck} href="/validations" tone={pendingValidations > 0 ? "warning" : "neutral"} />
        <KpiCard label="Relances à effectuer" value={overdueSituations} icon={BellRing} href="/relances" tone={overdueSituations > 0 ? "danger" : "neutral"} />
        <KpiCard label="Décomptes en attente" value={pendingPayments} icon={Wallet} href="/relances" />
        <KpiCard label="Alertes critiques" value={criticalAlerts.length} icon={AlertTriangle} tone={criticalAlerts.length > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alertes critiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.length === 0 ? (
              <p className="text-sm text-graphite-500">Aucune alerte critique en cours.</p>
            ) : (
              criticalAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="flex items-center justify-between rounded-md border border-surface-border px-3 py-2 text-sm hover:bg-surface-subtle"
                >
                  <span className="text-graphite-900">{alert.label}</span>
                  <Badge tone="danger">Urgent</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charge par gestionnaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadByManager.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-night-800 text-xs font-semibold text-white">
                    {m.initials}
                  </div>
                  <span className="text-graphite-900">{m.fullName}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-graphite-500">
                  <span>{m.siteCount} chantiers</span>
                  <span>{m.taskCount} tâches</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
