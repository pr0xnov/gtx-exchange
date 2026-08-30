"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector";
import { useDeposit } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";

export function DepositForm() {
  const { t } = useLocale();
  const [method, setMethod] = useState("TETHER_USDT");
  const [amount, setAmount] = useState("1000");
  const deposit = useDeposit();

  const numericAmount = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numericAmount < 250) {
      toast.error(t("deposit.minAmountError"));
      return;
    }
    try {
      await deposit.mutateAsync({ amount: numericAmount, method });
      toast.success(
        `${t("deposit.completedPrefix")} ${numericAmount.toFixed(2)} USDT ${t("deposit.completedSuffix")}`
      );
      setAmount("1000");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deposit.failedFallback"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>{t("deposit.selectPaymentMethod")}</Label>
        <div className="mt-2">
          <PaymentMethodSelector value={method} onChange={setMethod} />
        </div>
      </div>

      <div>
        <Label>{t("deposit.detailsLabel")}</Label>
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
            USDT
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {t("deposit.youWillGet")}{" "}
          <span className="text-foreground">{numericAmount.toFixed(2)} USDT</span>
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={deposit.isPending}>
        {deposit.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("deposit.submitButton")
        )}
      </Button>
    </form>
  );
}
