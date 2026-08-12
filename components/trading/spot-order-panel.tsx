"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import { useCreateSpotOrder, useCurrentUser, useSpotHoldings } from "@/hooks/use-api";

// Spot trading: no leverage, no order type, no TP/SL — just "how much of
// the base asset to buy or sell, right now, at the live price". Amounts
// move directly against the wallet balance / the owned quantity (see
// app/api/spot/orders for the atomic buy/sell logic).
export function SpotOrderPanel({
  symbol,
  displayName,
  livePrice,
}: {
  symbol: string;
  displayName: string;
  livePrice?: number;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("0.01");

  const createOrder = useCreateSpotOrder();
  const { data: user } = useCurrentUser();
  const { data: holdings } = useSpotHoldings();

  const baseAsset = displayName.split("/")[0] ?? displayName;
  const price = livePrice ?? 0;
  const numericQuantity = parseFloat(quantity) || 0;
  const estimatedTotal = numericQuantity * price;

  const usdtAvailable = user?.wallet ? Number(user.wallet.balance) : 0;
  const assetAvailable = holdings?.find((h) => h.symbol === symbol)?.quantity ?? 0;

  async function submit() {
    if (!numericQuantity || numericQuantity <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      await createOrder.mutateAsync({ symbol, side, quantity: numericQuantity });
      toast.success(`${side === "BUY" ? "Bought" : "Sold"} ${quantity} ${baseAsset}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order failed");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Spot trade</h3>

      <div className="mb-4 flex rounded-xl bg-surface p-1">
        {(["BUY", "SELL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
              side === s
                ? s === "BUY"
                  ? "bg-primary/15 text-primary"
                  : "bg-danger/15 text-danger"
                : "text-muted"
            )}
          >
            {s === "BUY" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>Amount ({baseAsset})</Label>
            <span className="text-xs text-muted">
              Avbl:{" "}
              {side === "BUY"
                ? formatCurrency(usdtAvailable)
                : `${assetAvailable} ${baseAsset}`}
            </span>
          </div>
          <Input
            type="number"
            step="0.0001"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="rounded-xl bg-surface p-3 text-xs text-muted">
          <div className="flex justify-between">
            <span>Price</span>
            <span className="font-tabular text-foreground">
              {price ? formatPrice(price) : "—"}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span>Estimated total</span>
            <span className="font-tabular text-foreground">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          variant={side === "BUY" ? "primary" : "danger"}
          size="lg"
          onClick={submit}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {side === "BUY" ? "Buy" : "Sell"} {baseAsset}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
