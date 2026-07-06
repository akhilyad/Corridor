import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN", "STAFF");
  return (
    <AppShell session={session} active="">
      {children}
    </AppShell>
  );
}
