import Link from "next/link";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-lg flex-col px-4 py-16">
        <h1 className="text-2xl font-semibold">Create your Corridor account</h1>
        <p className="mt-1 text-sm text-ink-500">
          Sign up as a supply partner to list housing, or as a procurement client to house crews and raise POs.
        </p>
        <div className="mt-8 rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-weld-700 hover:text-weld-800">
            Sign in
          </Link>
        </p>
      </div>
    </MarketingShell>
  );
}
