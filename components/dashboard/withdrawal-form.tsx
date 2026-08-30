"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector";
import { useWithdraw, useSpotWallet } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatCurrency } from "@/lib/utils";

const QUOTE_CURRENCY = "USDT";

export function WithdrawalForm() {
  const { t } = useLocale();
  const [method, setMethod] = useState("TETHER_USDT");
  const [amount, setAmount] = useState("500");
  const withdraw = useWithdraw();
  // The actual withdrawable amount — app/api/withdraw/route.ts checks and
  // debits SpotWallet.balance alone, never `locked` (funds reserved by
  // this user's own open Spot limit orders, see spot-order-panel.tsx's
  // identical use of this same hook). account-summary's `balance` is
  // balance+locked (the right number for a "Balance" headline, wrong one
  // here) — using it let this pre-check silently pass amounts the server
  // would then correctly reject as insufficient, which is exactly what
  // made "Balance shows plenty, withdrawal still fails" look like a bug.
  const { data: spotWallets } = useSpotWallet();
  const availableBalance = spotWallets?.find(
    (w) => w.currency === QUOTE_CURRENCY
  )?.balance;

  const numericAmount = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numericAmount < 50) {
      toast.error(t("withdrawal.minAmountError"));
      return;
    }
    if (availableBalance !== undefined && numericAmount > availableBalance) {
      toast.error(t("withdrawal.insufficientBalanceError"));
      return;
    }
    try {
      await withdraw.mutateAsync({ amount: numericAmount, method });
      toast.success(
        `${t("withdrawal.requestPrefix")} ${numericAmount.toFixed(2)} USDT ${t("withdrawal.requestSuffix")}`
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
        <div className="flex items-center justify-between">
          <Label>{t("withdrawal.detailsLabel")}</Label>
          {availableBalance !== undefined && (
            <span className="text-xs text-muted">
              {t("withdrawal.availableLabel")}{" "}
              <span className="font-tabular text-foreground">
                {formatCurrency(availableBalance)}
              </span>
            </span>
          )}
        </div>
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
            USDT
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {t("withdrawal.youWillGet")}{" "}
          <span className="text-foreground">{numericAmount.toFixed(2)} USDT</span>
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
