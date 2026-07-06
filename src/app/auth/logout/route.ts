import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Log out is a POST endpoint rather than a server action because the sidebar
 * form needs a real network round-trip that clears the cookie and redirects,
 * independent of the RSC action state machine.
 */
export async function POST() {
  await clearSession();
  revalidatePath("/", "layout");
  const url = new URL("/login", process.env.APP_BASE_URL || "http://localhost:3000");
  return NextResponse.redirect(url, { status: 303 });
}
