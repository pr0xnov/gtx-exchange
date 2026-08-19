"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector";
import { useWithdraw, usePortfolio } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";

export function WithdrawalForm() {
  const { t } = useLocale();
  const [method, setMethod] = useState("VISA_MASTERCARD");
  const [amount, setAmount] = useState("500");
  const withdraw = useWithdraw();
  const { data: portfolio } = usePortfolio();

  const numericAmount = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numericAmount < 50) {
      toast.error(t("withdrawal.minAmountError"));
      return;
    }
    if (portfolio && numericAmount > portfolio.balance) {
      toast.error(t("withdrawal.insufficientBalanceError"));
      return;
    }
    try {
      await withdraw.mutateAsync({ amount: numericAmount, method });
      toast.success(
        `${t("withdrawal.requestPrefix")} $${numericAmount.toFixed(2)} ${t("withdrawal.requestSuffix")}`
      );
      setAmount("500");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("withdrawal.failedFallback"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>{t("withdrawal.selectPaymentMethod")}</Label>
        <div className="mt-2">
          <PaymentMethodSelector value={method} onChange={setMethod} />
        </div>
      </div>

      <div>
        <Label>{t("withdrawal.detailsLabel")}</Label>
        <div className="relative mt-2">
          <Input
            type="number"
            min={50}
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
          {t("withdrawal.youWillGet")}{" "}
          <span className="text-foreground">{numericAmount.toFixed(2)} USD</span>
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={withdraw.isPending}>
        {withdraw.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("withdrawal.submitButton")
        )}
      </Button>
    </form>
  );
}
