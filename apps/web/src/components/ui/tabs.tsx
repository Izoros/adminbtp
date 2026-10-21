"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabDef {
  key: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ tabs, defaultKey }: { tabs: TabDef[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-1 border-b border-surface-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={tab.key === active}
            onClick={() => setActive(tab.key)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab.key === active
                ? "border-chantier-orange text-graphite-900"
                : "border-transparent text-graphite-500 hover:text-graphite-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{activeTab?.content}</div>
    </div>
  );
}
