import * as React from "react";
import Link from "next/link";
import { Logo } from "@/components/shell/app-shell";
import { ButtonLink } from "@/components/ui/button";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/market", label: "Market" },
  { href: "/pricing", label: "Pricing" },
  { href: "/calculator", label: "Calculator" },
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-base font-semibold">Corridor</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-md px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
            <ButtonLink href="/register" size="sm">Get started</ButtonLink>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-500">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="font-medium text-ink-700">Corridor</span>
            </div>
            <p>EPC workforce housing infrastructure · compliance-anchored marketplace · © {new Date().getFullYear()}</p>
          </div>
          <p className="mt-3 max-w-2xl text-xs text-ink-400">
            Demo build. Project names illustrate publicly-known European offshore-wind and data-centre builds; figures are illustrative and not audit-grade.
          </p>
        </div>
      </footer>
    </div>
  );
}
