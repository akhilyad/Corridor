import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class combiner used across the UI kit. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer cents as EUR currency. */
export function fmtEur(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const euros = Math.floor(abs / 100);
  const cc = abs % 100;
  return `${sign}€${euros.toLocaleString("en-IE")}.${String(cc).padStart(2, "0")}`;
}

/** Compact EUR for stat tiles (€7.56M, €983k, €1.2M). */
export function fmtEurCompact(cents: number): string {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? "-" : "";
  if (abs >= 1_000_000_00) return `${sign}€${(abs / 1_000_000_00).toFixed(abs >= 10_000_000_00 ? 0 : 2)}M`;
  if (abs >= 1_000_00) return `${sign}€${Math.round(abs / 1_000_00)}k`;
  return fmtEur(cents);
}

/** Basis points → "13.0%". */
export function fmtBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Months between two dates (inclusive fraction rounded to 1 dp). */
export function monthsBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const days = Math.max(0, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return +(days / 30.4375).toFixed(2);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Snake/Screaming case → Title Case for enum display. */
export function humanizeEnum(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Slugify a project/deployment code. */
export function slugify(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

/** Risk-adjusted distance label. */
export function fmtKm(km: number | null | undefined): string {
  if (km == null) return "—";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Human-readable byte count for vault document sizes. */
export function fmtBytes(n: number | null | undefined): string {
  if (n == null || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / 1024 / 1024).toFixed(1)} MiB`;
}

/**
 * JSON helpers — the schema stores what would be Prisma `Json` fields as
 * serialized `String` so SQLite (the local-dev driver) works without changes.
 * Use these everywhere instead of `JSON.parse(stringify(...))` inline.
 */
export function jstr(v: unknown): string {
  return JSON.stringify(v ?? null);
}

export function jparse<T = unknown>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
