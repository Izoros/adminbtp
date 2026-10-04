import { CheckCircle2, CircleAlert } from "lucide-react";

type FormMessageProps = {
  tone: "error" | "success";
  children: React.ReactNode;
};

export function FormMessage({ tone, children }: FormMessageProps) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={
        isError
          ? "flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          : "flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
      }
    >
      {isError ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
      )}
      <span>{children}</span>
    </div>
  );
}
