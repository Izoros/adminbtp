import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description: string;
  tone: "warm" | "ink" | "sage";
};

const toneClasses: Record<SectionCardProps["tone"], string> = {
  warm: "border-amber-200/80 bg-white/80 text-amber-950",
  ink: "border-slate-200/80 bg-slate-950 text-slate-50",
  sage: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
};

export function SectionCard({ title, description, tone }: SectionCardProps) {
  return (
    <article
      className={cn(
        "rounded-[1.5rem] border p-4 shadow-[0_16px_30px_rgba(148,163,184,0.08)]",
        toneClasses[tone],
      )}
    >
      <h3 className="text-sm font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-80">{description}</p>
    </article>
  );
}
