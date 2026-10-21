import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-surface-border bg-surface-white px-3 text-sm text-graphite-900 placeholder:text-graphite-500 focus-visible:ring-2 focus-visible:ring-status-info/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
