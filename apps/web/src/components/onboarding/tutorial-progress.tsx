"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

type TutorialProgressProps = {
  items: ReadonlyArray<{ id: string; title: string }>;
  userKey: string;
};

function buildStorageKey(userKey: string) {
  return `adminbtp:onboarding:tutorial-progress:v1:${userKey}`;
}

function readProgressValue(storageKey: string) {
  if (typeof window === "undefined") return "[]";

  return window.localStorage.getItem(storageKey) ?? "[]";
}

function parseProgress(value: string) {
  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("adminbtp-tutorial-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("adminbtp-tutorial-change", onStoreChange);
  };
}

export function TutorialProgress({ items, userKey }: TutorialProgressProps) {
  const storageKey = useMemo(() => buildStorageKey(userKey), [userKey]);
  const progressValue = useSyncExternalStore(
    subscribe,
    () => readProgressValue(storageKey),
    () => "[]",
  );
  const completedIds = useMemo(() => parseProgress(progressValue), [progressValue]);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const percentage = items.length
    ? Math.round((completedSet.size / items.length) * 100)
    : 0;

  function persist(nextIds: string[]) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextIds));
    window.dispatchEvent(new Event("adminbtp-tutorial-change"));
  }

  function toggleItem(itemId: string) {
    const nextIds = completedSet.has(itemId)
      ? completedIds.filter((id) => id !== itemId)
      : [...completedIds, itemId];
    persist(nextIds);
  }

  return (
    <section className="rounded-[1.75rem] border border-teal-200 bg-teal-50/80 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal-800 uppercase">
            Ma progression
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
            {completedSet.size} etape(s) sur {items.length}
          </h2>
          <p className="mt-2 text-sm text-stone-700">
            Cette checklist reste sur ce navigateur et ne contient aucune donnee metier.
          </p>
        </div>
        <button
          type="button"
          onClick={() => persist([])}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-900 transition hover:bg-teal-100"
        >
          <RotateCcw className="size-4" />
          Reinitialiser
        </button>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-label="Progression du didacticiel"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-teal-100 bg-white/90 p-4 text-sm text-stone-800"
          >
            <input
              type="checkbox"
              checked={completedSet.has(item.id)}
              onChange={() => toggleItem(item.id)}
              className="mt-0.5 size-4 accent-teal-700"
            />
            <span>{item.title}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
