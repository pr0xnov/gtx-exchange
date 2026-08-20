"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPOT_CURRENCIES } from "@/lib/spot/currencies";
import { useCreateBalanceAdjustment } from "@/hooks/use-admin-api";

const SELECT_CLASSNAME =
  "mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground";

// Adjustments at or above this notional get an extra type-to-confirm step
// (see section 19 of this task's own spec: "для крупных сумм желательно
// добавить дополнительное confirmation") — a plain USDT-equivalent
// threshold, not asset-aware pricing, since this is just a friction gate,
// not a financial calculation.
const LARGE_AMOUNT_THRESHOLD = 10_000;

export function BalanceAdjustmentForm({
  userId,
  userName,
  direction,
  onClose,
}: {
  userId: string;
  userName: string;
  direction: "CREDIT" | "DEBIT";
  onClose: () => void;
}) {
  const [asset, setAsset] = useState<string>("USDT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [error, setError] = useState<string | null>(null);
  const adjust = useCreateBalanceAdjustment();

  const numericAmount = parseFloat(amount);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const isLarge = isValidAmount && numericAmount >= LARGE_AMOUNT_THRESHOLD;
  const actionLabel = direction === "CREDIT" ? "Add Balance" : "Remove Balance";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidAmount) {
      setError("Enter a valid amount greater than zero");
      return;
    }
    if (reason.trim().length < 3) {
      setError("A reason is required");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    setError(null);
    try {
      await adjust.mutateAsync({
        userId,
        asset,
        amount: numericAmount,
        direction,
        reason: reason.trim(),
      });
      toast.success(
        `${direction === "CREDIT" ? "Added" : "Removed"} ${numericAmount} ${asset} ${
          direction === "CREDIT" ? "to" : "from"
        } ${userName}'s balance`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
      setStep("form");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{actionLabel}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label>User</Label>
              <div className="mt-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
                {userName}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ba-asset">Asset</Label>
                <select
                  id="ba-asset"
                  className={SELECT_CLASSNAME}
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                >
                  {SPOT_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ba-amount">Amount</Label>
                <Input
                  id="ba-amount"
                  type="number"
                  min="0"
                  step="any"
                  className="mt-1.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ba-reason">Reason</Label>
              <Input
                id="ba-reason"
                className="mt-1.5"
                placeholder="Manual balance adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant={direction === "CREDIT" ? "primary" : "danger"}
                className="flex-1"
              >
                {actionLabel}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-foreground">
              {direction === "CREDIT" ? "Add" : "Remove"}{" "}
              <span className="font-tabular font-semibold">
                {numericAmount.toLocaleString()} {asset}
              </span>{" "}
              {direction === "CREDIT" ? "to" : "from"}{" "}
              <span className="font-semibold">{userName}</span>&apos;s balance?
            </p>
            <p className="text-xs text-muted">Reason: {reason}</p>
            {isLarge && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                This is a large adjustment ({numericAmount.toLocaleString()} {asset}) —
                please double-check the amount before confirming.
              </p>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant={direction === "CREDIT" ? "primary" : "danger"}
                className="flex-1"
                onClick={handleConfirm}
                disabled={adjust.isPending}
              >
                {adjust.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("form")}
                disabled={adjust.isPending}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
