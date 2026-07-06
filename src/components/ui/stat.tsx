import * as React from "react";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white px-4 py-3.5 shadow-card", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold text-ink-900 tabular", valueClassName)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
    </div>
  );
}
