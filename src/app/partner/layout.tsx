import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("PARTNER");
  return (
    <AppShell session={session} active="">
      {children}
    </AppShell>
  );
}
