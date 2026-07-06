import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton. Next dev/hot-reload would otherwise stampede open handles
 * across every request in development; this re-uses the global instance.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
