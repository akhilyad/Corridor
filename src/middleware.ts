import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Route-level auth gate. Cheap: reads the JWT only (no DB). Authoritative
 * identity is re-fetched per-request inside server actions via getSession().
 *
 * Public: /, /login, /register, /forgot, /pricing, /calculator, /how-it-works,
 *         /market, /api/public/*.  Protected: /partner/*, /client/*, /admin/*.
 */

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot",
  "/forbidden",
  "/pricing",
  "/calculator",
  "/how-it-works",
  "/market",
  "/login/...",
];

function isPublic(path: string): boolean {
  if (path === "/" ) return true;
  if (path.startsWith("/api/public/")) return true;
  return PUBLIC_PATHS.some((p) => (p.endsWith("/...") ? path.startsWith(p.slice(0, -3)) : path === p));
}

const ROLE_PREFIX: Record<string, string[]> = {
  PARTNER: ["/partner"],
  CLIENT: ["/client"],
  ADMIN: ["/admin"],
  STAFF: ["/admin"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySession(token) : null;

  // Public assets pass through
  if (isPublic(pathname)) return NextResponse.next();

  // Protected sections require session
  if (pathname.startsWith("/partner") || pathname.startsWith("/client") || pathname.startsWith("/admin")) {
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // Role-prefix enforcement (belt to the suspenders in server actions)
    const allowed = ROLE_PREFIX[payload.role] ?? [];
    const ok = allowed.some((p) => pathname.startsWith(p));
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome(payload.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

function roleHome(role: string): string {
  if (role === "ADMIN" || role === "STAFF") return "/admin";
  if (role === "PARTNER") return "/partner";
  if (role === "CLIENT") return "/client";
  return "/";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api/public).*)"],
};
