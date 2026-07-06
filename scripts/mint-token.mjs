// One-off smoke-test helper: mints a corridor_session JWT for a seeded user
// (by email) using the same HS256 signing path as src/lib/auth.ts, then prints
// the cookie string. Usage: node scripts/mint-token.mjs <email>
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const email = process.argv[2] || "ops@corridor.example";
const secret = process.env.SESSION_SECRET || "dev-only-secret-please-set-SESSION_SECRET-32chars!";
const TTL = 60 * 60 * 24 * 14;

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { org: true },
  });
  if (!user || !user.isActive || !user.org) {
    console.error(`No active user found for ${email}`);
    process.exit(1);
  }
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TTL)
    .setIssuer("corridor")
    .setSubject(user.id)
    .sign(new TextEncoder().encode(secret));
  console.log(token);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
