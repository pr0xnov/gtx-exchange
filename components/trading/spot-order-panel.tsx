"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import { useCreateSpotOrder, useSpotWallet } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";

// All tracked pairs quote in USDT — see lib/binance/client.ts's
// TRACKED_SYMBOLS and lib/spot/currencies.ts's SPOT_CURRENCIES.
const QUOTE_CURRENCY = "USDT";
// Matches SpotOrder.quantity's own DB precision (Decimal(20,8)) — the
// same 8 there was already hardcoded at for maxQuantity below; there is
// no per-market precision table in this project to reuse instead.
const QUANTITY_DECIMALS = 8;
// Plain USDT/currency precision (cents) — matches formatCurrency's own
// 2-decimal display convention elsewhere in this app.
const QUOTE_DECIMALS = 2;

/** Truncates toward zero at `decimals` places — used for the slider-derived
 *  quantity so it never rounds *up* past the real available balance. */
function floorTo(value: number, decimals: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

/** Same truncation, formatted as a plain (unformatted, no thousands
 *  separators) numeric string suitable for a raw <input type="number">
 *  value — never "0" for a positive-but-tiny amount that would floor to
 *  literally 0 at this precision. */
function toPlainString(value: number, decimals: number): string {
  const truncated = floorTo(value, decimals);
  return truncated > 0 ? String(truncated) : "0";
}

// Spot trading: no leverage, no TP/SL — "how much of the base currency to
// buy or sell, at what price". MARKET fills immediately at the live
// price; LIMIT reserves funds and stays open until the ws engine fills it
// (server/ws) or it's cancelled from the open-orders table below.
//
// Available balance and the max a BUY/SELL can ever reach both come from
// the real SpotWallet (useSpotWallet()) — never a guessed or hardcoded
// figure. The UI clamps Quantity/the slider to that max as a convenience;
// app/api/spot/orders/route.ts's own atomic balance check is what
// actually protects against an over-large order (untouched by this file).
//
// BUY additionally supports entering the exact USDT amount to spend (see
// quoteAmount below) — the two fields (quoteAmount in USDT, quantity in
// the base currency) stay synchronized against `effectivePrice`, with
// `lastEdited` tracking which one the user is actively driving so a live
// market-price tick or a Limit-price edit recomputes only the OTHER
// field, never overwriting what the user just typed (spec: "primary
// input state"). The value actually submitted is still always
// `quantity` — quoteAmount is a pure UI convenience, never sent to the
// backend, which remains the sole authority on price/balance.
export function SpotOrderPanel({
  symbol,
  displayName,
  livePrice,
}: {
  symbol: string;
  displayName: string;
  livePrice?: number;
}) {
  const { t } = useLocale();
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("MARKET");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [limitPrice, setLimitPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  // BUY-only "how much USDT to spend" — kept in sync with `quantity`.
  const [quoteAmount, setQuoteAmount] = useState("0");
  // Which of quantity/quoteAmount the user is actively driving — the
  // other one is what gets recomputed when the price changes.
  const [lastEdited, setLastEdited] = useState<"quote" | "base">("quote");

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

  // BUY's ceiling is "how much of this coin the available USDT can buy";
  // SELL's is simply the coin balance itself — never the other way
  // around (spec section 12).
  const maxQuantity =
    side === "BUY"
      ? effectivePrice > 0
        ? floorTo(quoteAvailable / effectivePrice, QUANTITY_DECIMALS)
        : 0
      : floorTo(baseAvailable, QUANTITY_DECIMALS);

  const sliderPercent =
    side === "BUY"
      ? quoteAvailable > 0
        ? Math.min(
            100,
            Math.max(0, ((parseFloat(quoteAmount) || 0) / quoteAvailable) * 100)
          )
        : 0
      : maxQuantity > 0
        ? Math.min(100, Math.max(0, (numericQuantity / maxQuantity) * 100))
        : 0;

  // Re-clamp whenever the ceiling itself changes — switching side,
  // switching Market/Limit, or editing the Limit price all change
  // maxQuantity, and a quantity that was valid a moment ago may no
  // longer fit. Keeps quoteAmount in sync too when it does.
  useEffect(() => {
    const num = parseFloat(quantity) || 0;
    if (num > maxQuantity) {
      const clamped = maxQuantity > 0 ? maxQuantity : 0;
      setQuantity(clamped > 0 ? String(clamped) : "0");
      if (side === "BUY") {
        setQuoteAmount(
          effectivePrice > 0 && clamped > 0
            ? toPlainString(clamped * effectivePrice, QUOTE_DECIMALS)
            : "0"
        );
      }
    }
    // Only maxQuantity's own inputs should re-trigger this — not `quantity`
    // itself, or a user's own edit would immediately overwrite itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, maxQuantity]);

  // Switching from SELL back to BUY can leave quoteAmount stale (it isn't
  // touched while hidden on SELL) — refresh it from the current quantity
  // the instant the field becomes visible again.
  useEffect(() => {
    if (side !== "BUY") return;
    const q = parseFloat(quantity) || 0;
    setQuoteAmount(
      effectivePrice > 0 && q > 0
        ? toPlainString(q * effectivePrice, QUOTE_DECIMALS)
        : "0"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  // A live MARKET price tick, or a LIMIT price edit, changes
  // effectivePrice — recompute ONLY the field the user isn't actively
  // driving (per `lastEdited`), preserving whichever one they typed.
  useEffect(() => {
    if (side !== "BUY" || effectivePrice <= 0) return;
    if (lastEdited === "quote") {
      const amt = parseFloat(quoteAmount) || 0;
      if (amt > 0) setQuantity(toPlainString(amt / effectivePrice, QUANTITY_DECIMALS));
    } else {
      const q = parseFloat(quantity) || 0;
      if (q > 0) setQuoteAmount(toPlainString(q * effectivePrice, QUOTE_DECIMALS));
    }
    // Deliberately keyed only on what actually changes the *reference*
    // price — quantity/quoteAmount are read via closure, not deps, or
    // writing one would immediately re-trigger this on the other's behalf.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePrice, side]);

  function handleQuantityChange(raw: string) {
    if (raw === "") {
      setQuantity("");
      setLastEdited("base");
      return;
    }
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return;
    const clamped = Math.min(Math.max(num, 0), maxQuantity);
    setQuantity(String(clamped));
    setLastEdited("base");
    if (side === "BUY") {
      setQuoteAmount(
        effectivePrice > 0 ? toPlainString(clamped * effectivePrice, QUOTE_DECIMALS) : "0"
      );
    }
  }

  function handleQuoteAmountChange(raw: string) {
    if (raw === "") {
      setQuoteAmount("");
      setLastEdited("quote");
      return;
    }
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return;
    const clamped = Math.min(Math.max(num, 0), quoteAvailable);
    setQuoteAmount(String(clamped));
    setLastEdited("quote");
    setQuantity(
      effectivePrice > 0
        ? toPlainString(clamped / effectivePrice, QUANTITY_DECIMALS)
        : "0"
    );
  }

  function handleSliderChange(percent: number) {
    if (side === "BUY") {
      const amt = quoteAvailable > 0 ? (percent / 100) * quoteAvailable : 0;
      const plainAmt = toPlainString(amt, QUOTE_DECIMALS);
      setQuoteAmount(plainAmt);
      setLastEdited("quote");
      setQuantity(
        effectivePrice > 0
          ? toPlainString((parseFloat(plainAmt) || 0) / effectivePrice, QUANTITY_DECIMALS)
          : "0"
      );
      return;
    }
    setQuantity(
      maxQuantity > 0
        ? toPlainString((percent / 100) * maxQuantity, QUANTITY_DECIMALS)
        : "0"
    );
    setLastEdited("base");
  }

  async function submit() {
    if (!numericQuantity || numericQuantity <= 0) {
      toast.error(t("trading.orderPanel.errors.invalidAmount"));
      return;
    }
    if (numericQuantity > maxQuantity) {
      toast.error(
        side === "BUY"
          ? t("trading.orderPanel.errors.insufficientUsdt")
          : `${t("trading.orderPanel.errors.amountExceedsAvailable")} ${baseCurrency}`
      );
      return;
    }
    const numericLimitPrice = parseFloat(limitPrice);
    if (
      orderType === "LIMIT" &&
      (!limitPrice || !numericLimitPrice || numericLimitPrice <= 0)
    ) {
      toast.error(t("trading.orderPanel.errors.priceRequired"));
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
          ? `${
              side === "BUY"
                ? t("trading.orderPanel.success.bought")
                : t("trading.orderPanel.success.sold")
            } ${quantity} ${baseCurrency}`
          : side === "BUY"
            ? t("trading.orderPanel.success.limitBuyPlaced")
            : t("trading.orderPanel.success.limitSellPlaced")
      );
      if (orderType === "LIMIT") setLimitPrice("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("trading.orderPanel.errors.orderFailed")
      );
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t("trading.orderPanel.title")}
      </h3>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {(["BUY", "SELL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-xl py-2 text-sm font-semibold transition-colors",
              side === s
                ? s === "BUY"
                  ? "bg-primary/15 text-primary"
                  : "bg-danger/15 text-danger"
                : "bg-surface text-muted hover:text-foreground"
            )}
          >
            {s === "BUY" ? t("trading.orderPanel.buy") : t("trading.orderPanel.sell")}
          </button>
        ))}
      </div>

      <div className="mb-4 flex rounded-xl bg-surface p-1">
        {(["MARKET", "LIMIT"] as const).map((ot) => (
          <button
            key={ot}
            onClick={() => setOrderType(ot)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
              orderType === ot ? "bg-primary/15 text-primary" : "text-muted"
            )}
          >
            {ot === "LIMIT"
              ? t("trading.orderPanel.limit")
              : t("trading.orderPanel.market")}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orderType === "LIMIT" && (
          <div>
            <Label>
              {t("trading.orderPanel.priceLabel")} ({QUOTE_CURRENCY})
            </Label>
            <Input
              id="spot-order-limit-price"
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

        {side === "BUY" && (
          <div>
            <Label>
              {t("trading.orderPanel.amountLabel")} ({QUOTE_CURRENCY})
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="spot-order-quote-amount"
                type="number"
                step="0.01"
                min="0"
                max={quoteAvailable || undefined}
                className="pr-16"
                value={quoteAmount}
                onChange={(e) => handleQuoteAmountChange(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                {QUOTE_CURRENCY}
              </span>
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label>
              {t("trading.orderPanel.quantityLabel")} ({baseCurrency})
            </Label>
            <span className="text-xs text-muted">
              {t("trading.orderPanel.available")}{" "}
              <span className="font-tabular text-foreground">
                {side === "BUY"
                  ? formatCurrency(quoteAvailable)
                  : `${baseAvailable} ${baseCurrency}`}
              </span>
            </span>
          </div>
          <div className="relative">
            <Input
              id="spot-order-quantity"
              type="number"
              step="0.0001"
              min="0"
              max={maxQuantity || undefined}
              className="pr-16"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
              {baseCurrency}
            </span>
          </div>

          {/* A separate bordered/padded block, not just a thin control
              stacked right under the input — otherwise it reads as part
              of the input itself and invites dragging the wrong thing. */}
          <div className="mt-4 rounded-xl border border-border bg-surface p-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(sliderPercent)}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              disabled={side === "BUY" ? quoteAvailable <= 0 : maxQuantity <= 0}
              aria-label={
                side === "BUY"
                  ? t("trading.orderPanel.sliderBuyAria")
                  : t("trading.orderPanel.sliderSellAria")
              }
              className="h-6 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-muted">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* For BUY, the Amount (USDT) field above already IS the total —
            repeating it here would just duplicate the same number twice
            (spec: "do not duplicate fields unnecessarily"). SELL has no
            such field, so this stays its only total indicator. */}
        {side === "SELL" && (
          <div className="rounded-xl bg-surface p-3 text-xs text-muted">
            <div className="flex justify-between">
              <span>{t("trading.orderPanel.total")}</span>
              <span className="font-tabular text-foreground">
                {estimatedTotal ? `${formatCurrency(estimatedTotal)}` : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          variant={side === "BUY" ? "primary" : "danger"}
          className="w-full"
          size="lg"
          onClick={submit}
          disabled={createOrder.isPending || numericQuantity <= 0}
        >
          {createOrder.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `${side === "BUY" ? t("trading.orderPanel.buy") : t("trading.orderPanel.sell")} ${baseCurrency}`
          )}
        </Button>
      </div>
    </div>
  );
}
