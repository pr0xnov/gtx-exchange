import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { WithdrawalForm } from "@/components/dashboard/withdrawal-form";
import { InfoPanel } from "@/components/dashboard/info-panel";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { isUserVerified } from "@/lib/verification/status";

// Verification is required here and nowhere else — Trading/Spot Buy/Sell,
// Deposit, Markets and Wallet all stay open to any authenticated user.
// middleware.ts already guarantees requireUser() succeeds for this route.
export default async function WithdrawalPage() {
  const user = await requireUser();
  const verified = await isUserVerified(user.id);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Withdrawal</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {verified ? (
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <WithdrawalForm />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="mb-1 text-sm font-semibold text-foreground">
                Verification required
              </h2>
              <p className="max-w-md text-sm text-muted">
                To withdraw funds, please complete account verification first.
              </p>
            </div>
            <Button asChild>
              <Link href="/verification">Go to verification</Link>
            </Button>
          </div>
        )}
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
