"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector";
import { NetworkSelector } from "@/components/dashboard/network-selector";
import { useWithdraw, useSpotWallet } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import type { UsdtNetwork } from "@/lib/deposit/usdt-networks";

const QUOTE_CURRENCY = "USDT";
const MIN_WITHDRAWAL = 50;
// Matches formatCurrency()'s own 2-decimal display convention for USDT —
// the withdrawal amount never needs (or accepts) finer precision than
// what's actually shown on screen.
const AMOUNT_DECIMALS = 2;
// Only guards against a pathologically long paste; irrelevant in
// practice now that any value above the available balance is rejected
// at entry (see AMOUNT_INPUT_PATTERN/handleAmountChange below) — kept as
// a cheap upper bound on the regex itself, not a behavior anyone can hit.
const MAX_AMOUNT_DIGITS = 30;

// A single whole-string syntax match — NOT a strip-bad-characters
// sanitizer, and NOT sufficient on its own to accept an edit (see
// handleAmountChange, which additionally rejects anything > the
// available balance). "1e25" must be rejected outright, never silently
// reinterpreted as "125" by stripping just the "e". No leading "-" is
// permitted at all — a negative amount is simply invalid input here, not
// a value that gets displayed and then flagged. An input whose new value
// doesn't match this shape (or whose value exceeds the available
// balance) is never committed to state, so the field visibly stays at
// its last valid value instead of ever holding something invalid, even
// momentarily.
const AMOUNT_INPUT_PATTERN = new RegExp(
  `^\\d{0,${MAX_AMOUNT_DIGITS}}(\\.\\d{0,${AMOUNT_DECIMALS}})?$`
);

export function WithdrawalForm() {
  const { t } = useLocale();
  const [method, setMethod] = useState("TETHER_USDT");
  const [network, setNetwork] = useState<UsdtNetwork | "">("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const withdraw = useWithdraw();

  // Switching networks clears any address already typed — it would have
  // been for the previous network's chain, and silently reusing it could
  // send funds down the wrong rail.
  function handleNetworkChange(next: UsdtNetwork | "") {
    setNetwork(next);
    setAddress("");
  }
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
  const hasAmount = amount.trim() !== "";
  const belowMinimum = hasAmount && numericAmount < MIN_WITHDRAWAL;
  const amountError = belowMinimum ? t("withdrawal.minAmountError") : undefined;
  const isAmountValid = hasAmount && numericAmount >= MIN_WITHDRAWAL;
  const canSubmit = isAmountValid && network !== "" && address.trim() !== "";

  // Whole-value validation, not per-character stripping — see
  // AMOUNT_INPUT_PATTERN's own doc comment above for why "1e25"/letters/a
  // second "-" never partially stick. Beyond syntax, an edit whose
  // resulting number exceeds the available balance is rejected the exact
  // same way — not accepted-then-flagged — so the field can never hold an
  // amount greater than what's actually available, not even momentarily
  // between keystrokes. A paste behaves identically to typing here: both
  // arrive as a single onChange with the field's prospective new value,
  // which either passes both checks or is dropped entirely, leaving
  // whatever was there before (or empty, if it was empty).
  function handleAmountChange(raw: string) {
    if (raw === "") {
      setAmount("");
      return;
    }
    if (!AMOUNT_INPUT_PATTERN.test(raw)) return;
    const numeric = parseFloat(raw);
    if (!Number.isFinite(numeric)) return;
    if (availableBalance !== undefined && numeric > availableBalance) return;
    setAmount(raw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Re-checked here even though the submit button is already disabled
    // for every one of these cases (Section 6: "Do not rely only on
    // button state") — a defense-in-depth backstop, not the primary gate.
    if (!network) {
      toast.error(t("withdrawal.selectNetworkError"));
      return;
    }
    if (!address.trim()) {
      toast.error(t("withdrawal.addressRequiredError"));
      return;
    }
    // No "exceeds balance" check here on purpose — handleAmountChange
    // structurally prevents `amount` from ever holding a value greater
    // than availableBalance, so there is nothing left to catch at this
    // point. The one remaining way the true balance and this amount
    // could disagree by submit time (another withdrawal completing in
    // the gap between typing and clicking Request) is caught server-side
    // (app/api/withdraw/route.ts) and surfaced below via
    // serverInsufficientBalanceError.
    if (numericAmount < MIN_WITHDRAWAL) {
      toast.error(t("withdrawal.minAmountError"));
      return;
    }
    try {
      await withdraw.mutateAsync({
        amount: numericAmount,
        method,
        network,
        destinationAddress: address.trim(),
      });
      toast.success(
        `${t("withdrawal.requestPrefix")} ${formatCurrency(numericAmount)} ${t("withdrawal.requestSuffix")}`
      );
      setAmount("");
      setAddress("");
    } catch (err) {
      // The backend's own authoritative balance check (app/api/withdraw/
      // route.ts) is the one that actually matters — it can still reject
      // this exact request if the real balance changed between this form
      // loading and the request landing (e.g. another withdrawal already
      // in flight). useWithdraw()'s onError already refreshes the
      // balance queries so a stale "Available" figure never lingers;
      // this just shows the localized message for that specific case
      // rather than the raw backend string.
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message === "Insufficient balance for this withdrawal"
          ? t("withdrawal.serverInsufficientBalanceError")
          : message || t("withdrawal.failedFallback")
      );
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
        <Label>{t("deposit.selectNetwork")}</Label>
        <div className="mt-2">
          <NetworkSelector value={network} onChange={handleNetworkChange} />
        </div>
      </div>

      <div>
        <Label>{t("withdrawal.addressLabel")}</Label>
        <div className="mt-2">
          <Input
            id="withdrawal-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("withdrawal.addressPlaceholder")}
          />
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
            id="withdrawal-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={cn(
              "pr-16 text-lg font-semibold",
              amountError && "border-danger focus:border-danger focus:ring-danger"
            )}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
            USDT
          </span>
        </div>
        {/* Rendered as a sibling below the relative wrapper above, not via
            Input's own built-in `error` prop — that prop renders the
            message *inside* the same relatively-positioned box the USDT
            label uses as its centering anchor, so an error appearing
            would grow that box's height and throw off top-1/2 centering.
            Same styling Input's own error path uses, just positioned
            outside it. */}
        {amountError && <p className="mt-1.5 text-xs text-danger">{amountError}</p>}
        <p className="mt-2 text-sm text-muted">
          {t("withdrawal.youWillGet")}{" "}
          {/* Fixed 2 decimals (never trimmed, unlike formatCurrency()
              elsewhere in this app) so "250" reads as "250.00 USDT", not
              just "250 USDT" — and, same as formatCurrency(), toLocaleString
              never produces scientific notation regardless of magnitude,
              unlike the old numericAmount.toFixed(2) this replaced (which
              is exactly how "1e+25 USDT" made it onto the screen: toFixed
              switches to exponential for any number >= 1e21). */}
          <span className="text-foreground">{formatPrice(numericAmount)} USDT</span>
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={withdraw.isPending || !canSubmit}
      >
        {withdraw.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("withdrawal.submitButton")
        )}
      </Button>
    </form>
  );
}
