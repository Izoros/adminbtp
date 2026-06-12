"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight, Building2, FileStack, LayoutDashboard, X } from "lucide-react";

type NewUserGuideProps = {
  userId: string;
  userLabel: string;
};

const guideSteps = [
  {
    title: "1. Cree ton organisation",
    description:
      "Commence par ouvrir ton espace multi-tenant pour rattacher ton entreprise ou ton client principal.",
    href: "/organizations",
    actionLabel: "Ouvrir les organisations",
    icon: Building2,
  },
  {
    title: "2. Lance un chantier",
    description:
      "Depuis le module chantiers, cree le premier projet et definis le role principal de l'organisation.",
    href: "/projects",
    actionLabel: "Creer un chantier",
    icon: LayoutDashboard,
  },
  {
    title: "3. Charge les documents clefs",
    description:
      "Ajoute ensuite les pieces de reference pour enclencher signatures, suivis et assistance technique.",
    href: "/documents",
    actionLabel: "Ouvrir les documents",
    icon: FileStack,
  },
] as const;

function buildStorageKey(userId: string) {
  return `adminbtp:onboarding:new-user-guide:${userId}`;
}

function subscribeToGuideChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener("adminbtp-onboarding-change", handleChange as EventListener);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("adminbtp-onboarding-change", handleChange as EventListener);
  };
}

function readDismissedState(storageKey: string) {
  if (typeof window === "undefined") {
    return true;
  }

  return Boolean(window.localStorage.getItem(storageKey));
}

export function NewUserGuide({ userId, userLabel }: NewUserGuideProps) {
  const storageKey = useMemo(() => buildStorageKey(userId), [userId]);
  const isDismissed = useSyncExternalStore(
    subscribeToGuideChanges,
    () => readDismissedState(storageKey),
    () => true,
  );

  function closeGuide() {
    window.localStorage.setItem(storageKey, new Date().toISOString());
    window.dispatchEvent(new Event("adminbtp-onboarding-change"));
  }

  if (isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,#fffaf5_0%,#f8efe2_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 px-6 py-5 sm:px-8">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.24em] text-stone-500 uppercase">
              Demarrage rapide
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-3xl">
              Bienvenue {userLabel} dans AdminBTP
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
              Voici le parcours minimum pour prendre l&apos;application en main et lancer
              tes premiers flux sans te perdre dans les modules.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fermer le guide"
            onClick={closeGuide}
            className="inline-flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:px-8 lg:grid-cols-3">
          {guideSteps.map((step) => (
            <article
              key={step.title}
              className="rounded-[1.5rem] border border-stone-200/80 bg-white/85 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-stone-950 p-3 text-white">
                  <step.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-stone-950">{step.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-700">{step.description}</p>
              <Link
                href={step.href}
                onClick={closeGuide}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                {step.actionLabel}
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-200/80 bg-white/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-stone-600">
            Le guide ne s&apos;affiche qu&apos;une fois par compte sur ce navigateur.
          </p>
          <button
            type="button"
            onClick={closeGuide}
            className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
