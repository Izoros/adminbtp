import {
  Building2,
  ClipboardCheck,
  FileStack,
  FolderKanban,
  Landmark,
  MailCheck,
  Network,
  ShieldCheck,
} from "lucide-react";

export const onboardingGuideSteps = [
  {
    id: "organization",
    title: "Creer l'organisation",
    shortTitle: "Organisation",
    description:
      "Creez l'entreprise ou le client qui portera les chantiers, puis verifiez les membres et leurs roles.",
    href: "/organizations",
    actionLabel: "Configurer l'organisation",
    outcome: "Une organisation accessible et un perimetre de travail clair.",
    icon: Building2,
  },
  {
    id: "project",
    title: "Ouvrir le premier chantier",
    shortTitle: "Chantier",
    description:
      "Creez le projet, choisissez l'organisation proprietaire et attribuez son premier role BTP.",
    href: "/projects",
    actionLabel: "Creer un chantier",
    outcome: "Un chantier rattache a la bonne organisation et au bon role.",
    icon: FolderKanban,
  },
  {
    id: "phases",
    title: "Choisir le parcours chantier",
    shortTitle: "Phases",
    description:
      "Selectionnez le profil MOA, MOE, TCE ou entreprise de lot et controlez les jalons attendus.",
    href: "/phases",
    actionLabel: "Verifier les phases",
    outcome: "Une checklist adaptee au role reel sur le chantier.",
    icon: ClipboardCheck,
  },
  {
    id: "documents",
    title: "Centraliser les documents",
    shortTitle: "Documents",
    description:
      "Ajoutez les pieces de reference, preparez les documents generes et gardez leur statut lisible.",
    href: "/documents",
    actionLabel: "Ouvrir les documents",
    outcome: "Une base documentaire exploitable pour les validations et le suivi.",
    icon: FileStack,
  },
  {
    id: "validation",
    title: "Organiser les validations",
    shortTitle: "Validations",
    description:
      "Preparez le circuit de signature et conservez une validation humaine avant toute action sensible.",
    href: "/signatures",
    actionLabel: "Configurer les signatures",
    outcome: "Un circuit de decision trace et sans validation automatique cachee.",
    icon: ShieldCheck,
  },
  {
    id: "communications",
    title: "Rattacher les communications",
    shortTitle: "Communications",
    description:
      "Classez les emails par organisation et chantier, puis traitez les relances de paiement prioritaires.",
    href: "/emails",
    secondaryHref: "/followups",
    actionLabel: "Ouvrir les emails",
    secondaryActionLabel: "Voir les relances",
    outcome: "Des echanges et echeances relies au bon dossier metier.",
    icon: MailCheck,
  },
  {
    id: "odoo",
    title: "Preparer Odoo et le social",
    shortTitle: "Odoo social",
    description:
      "Reliez les entites AdminBTP aux modeles Odoo de facturation, collaborateurs, contrats, temps, absences et paie.",
    href: "/odoo",
    actionLabel: "Preparer Odoo",
    outcome: "Des mappings explicites avant toute synchronisation de donnees sensibles.",
    icon: Network,
  },
  {
    id: "operations",
    title: "Controler l'exploitation",
    shortTitle: "Exploitation",
    description:
      "Consultez le cockpit, l'etat des connexions et les alertes avant d'activer un service externe.",
    href: "/admin",
    secondaryHref: "/admin/readiness",
    actionLabel: "Ouvrir le cockpit",
    secondaryActionLabel: "Verifier les connexions",
    outcome: "Une mise en service fondee sur des controles, pas sur des suppositions.",
    icon: Landmark,
  },
] as const;
