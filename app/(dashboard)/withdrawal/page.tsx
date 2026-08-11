import { WithdrawalForm } from "@/components/dashboard/withdrawal-form";
import { InfoPanel } from "@/components/dashboard/info-panel";

export default function WithdrawalPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Withdrawal</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <WithdrawalForm />
        </div>
        <InfoPanel
          title="Important information"
          items={[
            "Withdrawals are processed within 1-3 business days.",
            "Make sure that all trading positions are closed before making a withdrawal.",
            "There is no fee for withdrawal.",
          ]}
        />
      </div>
    </div>
  );
}
