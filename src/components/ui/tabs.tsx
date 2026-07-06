"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto scrollbar-thin border-b border-ink-100", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            value === t.id
              ? "border-weld-500 text-ink-900"
              : "border-transparent text-ink-500 hover:text-ink-800",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]", value === t.id ? "bg-weld-100 text-weld-700" : "bg-ink-100 text-ink-500")}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
