import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Auth primitives.
 * - Passwords are bcrypt-hashed (cost 10) at the action boundary.
 * - Sessions are HS256-signed JWTs in an httpOnly cookie, never localStorage.
 * - The JWT carries the minimum identity needed for middleware role-gating; the
 *   full record is re-fetched per request from the DB (so role/org changes are
 *   picked up without re-issuing tokens — see session.ts).
 */

const SESSION_COOKIE = "corridor_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
export const SESSION_ALG = "HS256";

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 16) {
    // Dev-only fallback so the app still boots without a configured secret.
    // A loud warning is logged by the session helper, not here, to keep this pure.
    return new TextEncoder().encode("dev-only-secret-please-set-SESSION_SECRET-32chars!");
  }
  return new TextEncoder().encode(raw);
}

export type SessionPayload = JWTPayload & {
  sub: string;
  email: string;
  role: string;
  orgId?: string | null;
};

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .setIssuer("corridor")
    .setSubject(payload.sub)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "corridor",
      algorithms: [SESSION_ALG],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
