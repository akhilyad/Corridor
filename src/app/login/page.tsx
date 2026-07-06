import Link from "next/link";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-500">Access your partner, client, or staff dashboard.</p>
        <div className="mt-8 rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">
          No account?{" "}
          <Link href="/register" className="font-medium text-weld-700 hover:text-weld-800">
            Create one
          </Link>
        </p>
      </div>
    </MarketingShell>
  );
}
