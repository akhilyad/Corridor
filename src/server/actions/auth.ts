"use server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { setSession, clearSession } from "@/lib/session";
import { loginSchema, registerSchema, parseZod } from "@/lib/schemas";
import { roleHome } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function loginAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ redirect: string }>> {
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const parsed = parseZod(loginSchema, raw);
  if (!parsed.ok) return { ok: false, error: parsed.errors.email ?? parsed.errors.password ?? "Invalid input" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { org: true },
  });
  if (!user || !user.isActive || !user.org) {
    return { ok: false, error: "No account found with those credentials." };
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { ok: false, error: "No account found with those credentials." };
  }
  await setSession({ id: user.id, email: user.email, role: user.role, orgId: user.orgId });
  await logAudit({ userId: user.id, action: "auth.login", entityType: "user", entityId: user.id });
  return { ok: true, data: { redirect: roleHome(user.role as never) } };
}

export async function registerAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ redirect: string }>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyName: formData.get("companyName"),
    country: formData.get("country"),
    vatId: formData.get("vatId") || "",
    phone: formData.get("phone") || "",
  };
  const parsed = parseZod(registerSchema, raw);
  if (!parsed.ok) {
    const firstErr = Object.values(parsed.errors)[0];
    return { ok: false, error: firstErr ?? "Invalid input" };
  }
  const { email, name, password, role, companyName, country, vatId, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const org = await prisma.organization.create({
    data: {
      type: role, // PARTNER | CLIENT
      name: companyName,
      legalName: companyName,
      country,
      vatId: vatId || undefined,
      contactEmail: email,
      phone: phone || undefined,
      accreditationStatus: "NOT_STARTED",
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role,
      orgId: org.id,
      isActive: true,
      phone: phone || undefined,
    },
  });

  await setSession({ id: user.id, email: user.email, role: user.role, orgId: org.id });
  await logAudit({ userId: user.id, action: "auth.register", entityType: "organization", entityId: org.id, meta: { role, company: companyName } });
  revalidatePath("/");
  return { ok: true, data: { redirect: roleHome(user.role as never) } };
}

export async function logoutAction(): Promise<ActionResult> {
  await clearSession();
  revalidatePath("/");
  return { ok: true, data: null };
}

/** Used by the /auth/logout POST route (middleware is stateless so we need a real endpoint). */
export async function logoutRouteAction(): Promise<void> {
  await clearSession();
  revalidatePath("/");
}

// re-export zod for convenience in forms that mix client/server validation
export { z };
