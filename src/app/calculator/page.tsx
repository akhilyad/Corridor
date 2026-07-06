import { MarketingShell } from "@/components/shell/marketing-shell";
import { CalculatorForm } from "./calculator-form";

export default function CalculatorPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-weld-700">Live economics</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink-900">Pricing calculator</h1>
          <p className="mt-2 text-ink-600">
            Slide the inputs and the math updates instantly — this is the same
            engine that quotes real deployments and raises NET-30 invoices
            in-product, so what you see here is what a client pays. Default loads
            the whitepaper worked example.
          </p>
        </div>
        <div className="mt-8">
          <CalculatorForm />
        </div>
      </div>
    </MarketingShell>
  );
}
