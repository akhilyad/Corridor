"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; tone: "success" | "error" | "info" };

const ToasterCtx = React.createContext<{
  push: (t: Omit<Toast, "id">) => void;
} | null>(null);

let _id = 0;

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = ++_id;
    setToasts((cur) => [...cur, { ...t, id }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToasterCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-lg border px-4 py-3 shadow-cardHover animate-fade-in",
              t.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              t.tone === "error" && "border-red-200 bg-red-50 text-red-800",
              t.tone === "info" && "border-ink-200 bg-white text-ink-800",
            )}
          >
            <p className="text-sm font-medium">{t.title}</p>
          </div>
        ))}
      </div>
    </ToasterCtx.Provider>
  );
}

export function useToaster() {
  const ctx = React.useContext(ToasterCtx);
  if (!ctx) {
    // Graceful no-op if used outside provider (e.g. SSR) — never throw in render.
    return { push: (_t: Omit<Toast, "id">) => {} };
  }
  return ctx;
}

/** Helper for async server-action callers. */
export async function withToast<T extends { ok: boolean }>(
  push: ReturnType<typeof useToaster>["push"],
  promise: Promise<T>,
  opts: { success?: string; error?: string },
): Promise<T> {
  const r = await promise;
  if (r.ok) {
    if (opts.success) push({ title: opts.success, tone: "success" });
  } else {
    push({ title: opts.error ?? "Something went wrong", tone: "error" });
  }
  return r;
}
