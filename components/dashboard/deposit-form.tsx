"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector";
import { NetworkSelector } from "@/components/dashboard/network-selector";
import { DepositAddressCard } from "@/components/dashboard/deposit-address-card";
import { DepositProofModal } from "@/components/dashboard/deposit-proof-modal";
import { useLocale } from "@/lib/i18n/locale-context";
import type { UsdtNetwork } from "@/lib/deposit/usdt-networks";

export function DepositForm() {
  const { t } = useLocale();
  const [method, setMethod] = useState("TETHER_USDT");
  const [network, setNetwork] = useState<UsdtNetwork | "">("");
  const [amount, setAmount] = useState("250");
  const [showProofModal, setShowProofModal] = useState(false);

  const numericAmount = parseFloat(amount) || 0;

  // Clicking "Пополнить счёт" never creates a deposit by itself anymore
  // — it only validates network+amount and opens the payment-
  // confirmation modal, which is the one place that actually submits
  // the request (see deposit-proof-modal.tsx: it requires a screenshot
  // and POSTs the real multipart request to /api/deposit).
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!network) {
      toast.error(t("deposit.selectNetworkError"));
      return;
    }
    if (numericAmount < 250) {
      toast.error(t("deposit.minAmountError"));
      return;
    }
    setShowProofModal(true);
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

        <div className="mt-4">
          <Label>{t("deposit.selectNetwork")}</Label>
          <div className="mt-2">
            <NetworkSelector value={network} onChange={setNetwork} />
          </div>
        </div>

        {network && (
          <div className="mt-4">
            <Label>{t("deposit.depositAddressLabel")}</Label>
            <div className="mt-2">
              <DepositAddressCard network={network} />
            </div>
          </div>
        )}

        <div className="mt-4">
          <Label>{t("deposit.amountLabel")}</Label>
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
      </div>

      <Button type="submit" size="lg" className="w-full">
        {t("deposit.submitButton")}
      </Button>

      {showProofModal && network && (
        <DepositProofModal
          network={network}
          amount={numericAmount}
          onClose={() => setShowProofModal(false)}
          onSuccess={() => {
            setShowProofModal(false);
            setAmount("250");
          }}
        />
      )}
    </form>
  );
}
