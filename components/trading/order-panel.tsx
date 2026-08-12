"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { useCreateOrder } from "@/hooks/use-api";

const LEVERAGE_OPTIONS = [1, 5, 10, 20, 50, 100];

export function OrderPanel({
  symbol,
  displayName,
  livePrice,
}: {
  symbol: string;
  displayName: string;
  livePrice?: number;
}) {
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [amount, setAmount] = useState("0.1");
  const [leverage, setLeverage] = useState(100);
  const [limitPrice, setLimitPrice] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const createOrder = useCreateOrder();

  const price = livePrice ?? 0;
  const spread = price * 0.0001; // synthetic 1bp spread for buy/sell display
  const buyPrice = price + spread;
  const sellPrice = price - spread;

  async function submit(side: "BUY" | "SELL") {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (orderType === "LIMIT" && !limitPrice) {
      toast.error("Enter a limit price");
      return;
    }

    try {
      await createOrder.mutateAsync({
        symbol,
        type: orderType,
        side,
        amount: numericAmount,
        leverage,
        limitPrice: orderType === "LIMIT" ? parseFloat(limitPrice) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      });
      toast.success(
        `${side === "BUY" ? "Long" : "Short"} position opened on ${displayName}`
      );
      setTakeProfit("");
      setStopLoss("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order failed");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Open a trade</h3>

      <div className="mb-4 flex rounded-xl bg-surface p-1">
        {(["MARKET", "LIMIT"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
              orderType === t ? "bg-primary/15 text-primary" : "text-muted"
            )}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.001"
            min="0"
            className="mt-1.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {orderType === "LIMIT" && (
          <div>
            <Label>Limit price</Label>
            <Input
              type="number"
              className="mt-1.5"
              placeholder={price ? formatPrice(price) : "0.00"}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>Leverage</Label>
            <span className="text-xs font-semibold text-primary">1:{leverage}</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={cn(
                  "rounded-lg py-1.5 text-[11px] font-medium transition-colors",
                  leverage === lev
                    ? "bg-primary/15 text-primary"
                    : "bg-surface text-muted hover:text-foreground"
                )}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Take Profit</Label>
          <Input
            type="number"
            className="mt-1.5"
            placeholder="Optional"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
          />
        </div>
        <div>
          <Label>Stop Loss</Label>
          <Input
            type="number"
            className="mt-1.5"
            placeholder="Optional"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => submit("BUY")}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Buy&nbsp;&nbsp;{price ? formatPrice(buyPrice) : "—"}</>
          )}
        </Button>
        <Button
          variant="danger"
          className="w-full"
          size="lg"
          onClick={() => submit("SELL")}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Sell&nbsp;&nbsp;{price ? formatPrice(sellPrice) : "—"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
