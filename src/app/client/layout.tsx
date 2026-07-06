import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("CLIENT");
  return (
    <AppShell session={session} active="">
      {children}
    </AppShell>
  );
}
