"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import { useCreateSpotOrder, useSpotWallet } from "@/hooks/use-api";

// All tracked pairs quote in USDT — see lib/binance/client.ts's
// TRACKED_SYMBOLS and lib/spot/currencies.ts's SPOT_CURRENCIES.
const QUOTE_CURRENCY = "USDT";

// Spot trading: no leverage, no TP/SL — "how much of the base currency to
// buy or sell, at what price". MARKET fills immediately at the live
// price; LIMIT reserves funds and stays open until the ws engine fills it
// (server/ws) or it's cancelled from the open-orders table below.
export function SpotOrderPanel({
  symbol,
  displayName,
  livePrice,
}: {
  symbol: string;
  displayName: string;
  livePrice?: number;
}) {
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [limitPrice, setLimitPrice] = useState("");
  const [quantity, setQuantity] = useState("0.01");

  const createOrder = useCreateSpotOrder();
  const { data: wallets } = useSpotWallet();

  const baseCurrency = displayName.split("/")[0] ?? displayName;
  const marketPrice = livePrice ?? 0;
  const effectivePrice =
    orderType === "LIMIT" ? parseFloat(limitPrice) || 0 : marketPrice;
  const numericQuantity = parseFloat(quantity) || 0;
  const estimatedTotal = numericQuantity * effectivePrice;

  const quoteAvailable =
    wallets?.find((w) => w.currency === QUOTE_CURRENCY)?.balance ?? 0;
  const baseAvailable = wallets?.find((w) => w.currency === baseCurrency)?.balance ?? 0;

  async function submit(side: "BUY" | "SELL") {
    if (!numericQuantity || numericQuantity <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const numericLimitPrice = parseFloat(limitPrice);
    if (
      orderType === "LIMIT" &&
      (!limitPrice || !numericLimitPrice || numericLimitPrice <= 0)
    ) {
      toast.error("Enter a price");
      return;
    }

    try {
      await createOrder.mutateAsync({
        symbol,
        side,
        type: orderType,
        quantity: numericQuantity,
        price: orderType === "LIMIT" ? numericLimitPrice : undefined,
      });
      toast.success(
        orderType === "MARKET"
          ? `${side === "BUY" ? "Bought" : "Sold"} ${quantity} ${baseCurrency}`
          : `Limit ${side === "BUY" ? "buy" : "sell"} order placed`
      );
      if (orderType === "LIMIT") setLimitPrice("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Order failed");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Spot trade</h3>

      <div className="mb-4 flex rounded-xl bg-surface p-1">
        {(["LIMIT", "MARKET"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
              orderType === t ? "bg-primary/15 text-primary" : "text-muted"
            )}
          >
            {t === "LIMIT" ? "Limit" : "Market"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orderType === "LIMIT" && (
          <div>
            <Label>Price ({QUOTE_CURRENCY})</Label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              className="mt-1.5"
              placeholder={marketPrice ? formatPrice(marketPrice) : "0.00"}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>Quantity ({baseCurrency})</Label>
            <span className="text-xs text-muted">
              Avbl: {formatCurrency(quoteAvailable)} · {baseAvailable} {baseCurrency}
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
            <span>Total</span>
            <span className="font-tabular text-foreground">
              {estimatedTotal ? `${formatCurrency(estimatedTotal)}` : "—"}
            </span>
          </div>
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
            `Buy ${baseCurrency}`
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
            `Sell ${baseCurrency}`
          )}
        </Button>
      </div>
    </div>
  );
}
