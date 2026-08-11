import { DepositForm } from "@/components/dashboard/deposit-form";
import { InfoPanel } from "@/components/dashboard/info-panel";

export default function DepositPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Deposit</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <DepositForm />
        </div>
        <InfoPanel
          title="Important information"
          items={[
            "Minimum deposit amount is 250 USD.",
            "Make sure that all payment details are correct.",
            "We do not charge a fee for deposits.",
          ]}
        />
      </div>
    </div>
  );
}
