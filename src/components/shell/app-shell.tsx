"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navForRole, type NavItem } from "@/components/shell/nav";
import type { Role, SessionUser } from "@/lib/types";
import { roleLabel } from "@/lib/permissions";
import { LogOut, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppShell({
  session,
  active,
  children,
}: {
  session: SessionUser;
  active?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const items = navForRole(session.role as Role);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Derive the active nav id from the URL when not explicitly passed: match the
  // longest nav href that is a prefix of the current pathname (so
  // /client/deployments/123 still highlights "deployments").
  const computedActive =
    active ??
    items
      .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0]?.id ??
    "";

  return (
    <div className="min-h-screen flex bg-ink-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-200 bg-white transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5 border-b border-ink-100">
          <Logo />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-900">Corridor</div>
            <div className="text-[10px] uppercase tracking-wide text-ink-400">EPC housing ops</div>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map((item) => (
            <NavLink key={item.id} item={item} active={computedActive === item.id} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>
        <div className="absolute bottom-0 inset-x-0 border-t border-ink-100 px-4 py-3 text-xs text-ink-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="truncate">{session.orgName ?? "—"} · {new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink-950/30 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink-200 bg-white/90 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-ink-900 leading-tight">{session.name}</div>
              <div className="text-[11px] text-ink-400 leading-tight">{session.orgName}</div>
            </div>
            <Badge tone="ink" className="hidden sm:inline-flex">
              {roleLabel[session.role]}
            </Badge>
            <form action="/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="icon" title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-weld-50 text-weld-800 font-medium" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-weld-600" : "text-ink-400")} />
      <span>{item.label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-weld-400" />}
    </a>
  );
}

function Breadcrumbs() {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-400">
      <span className="font-medium text-ink-600">Corridor</span>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-weld-400", className)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="7" cy="7" r="1.6" fill="currentColor" />
        <circle cx="17" cy="12" r="1.6" fill="currentColor" />
        <circle cx="9" cy="17" r="1.6" fill="currentColor" />
      </svg>
    </div>
  );
}
