"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector";
import { useDeposit } from "@/hooks/use-api";

export function DepositForm() {
  const [method, setMethod] = useState("VISA_MASTERCARD");
  const [amount, setAmount] = useState("1000");
  const deposit = useDeposit();

  const numericAmount = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numericAmount < 250) {
      toast.error("Minimum deposit amount is 250 USD");
      return;
    }
    try {
      await deposit.mutateAsync({ amount: numericAmount, method });
      toast.success(`Deposit of $${numericAmount.toFixed(2)} completed`);
      setAmount("1000");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Select payment method</Label>
        <div className="mt-2">
          <PaymentMethodSelector value={method} onChange={setMethod} />
        </div>
      </div>

      <div>
        <Label>Deposit details</Label>
        <div className="relative mt-2">
          <Input
            type="number"
            min={250}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-16 text-lg font-semibold"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
            USD
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          You will get <span className="text-foreground">{numericAmount.toFixed(2)} USD</span>
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={deposit.isPending}
      >
        {deposit.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Make a deposit"
        )}
      </Button>
    </form>
  );
}
