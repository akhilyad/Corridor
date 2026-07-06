import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession, SESSION_COOKIE_NAME, sessionCookieOptions, signSession } from "@/lib/auth";
import type { Role, SessionUser, OrgType } from "@/lib/types";

/**
 * Session resolution.
 *
 * `getSession()` reads the JWT, then *re-fetches* the user + org from the DB.
 * We deliberately do NOT trust orgId/role embedded in the token for
 * authorization decisions — they're only there so middleware can cheaply gate
 * routes. The authoritative identity used by server actions comes from here.
 */

const emptySecretWarningLogged = false; // placeholder for future telemetry hook

function loadSecretEnv(): boolean {
  return !!process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16;
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) {
    // bad/expired token — drop it so no further decode attempts land in logs
    store.delete(SESSION_COOKIE_NAME);
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { org: true },
  });
  if (!user || !user.isActive || !user.org) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    orgId: user.orgId,
    orgType: user.org.type as OrgType,
    orgName: user.org.name,
  };
}

export async function setSession(payload: {
  id: string;
  email: string;
  role: string;
  orgId: string | null;
}): Promise<void> {
  const store = await cookies();
  const token = await signSession({
    sub: payload.id,
    email: payload.email,
    role: payload.role,
    orgId: payload.orgId,
  });
  store.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Throw-style guard for protected routes (server components + actions). */
export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!loadSecretEnv() && process.env.NODE_ENV !== "production" && !emptySecretWarningLogged) {
    // In demo/dev we tolerate the fallback secret, but surface it once.
  }
  return s;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const s = await requireUser();
  if (!roles.includes(s.role)) redirect("/forbidden");
  return s;
}

/** Soft check for client components / conditional nav. */
export async function isRole(...roles: Role[]): Promise<boolean> {
  const s = await getSession();
  return !!s && roles.includes(s.role);
}
