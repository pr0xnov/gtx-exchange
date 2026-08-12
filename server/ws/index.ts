/**
 * Standalone real-time market data + trading engine service.
 *
 * Responsibilities:
 *  1. Maintains a persistent connection to Binance's combined ticker stream.
 *  2. Broadcasts live price updates to all connected browser clients.
 *  3. Periodically persists the latest prices to the `Asset` table.
 *  4. Periodically scans open positions for Take Profit / Stop Loss /
 *     Liquidation triggers and auto-closes them.
 *
 * Runs as its own container (see docker-compose.yml) so it stays alive
 * independently of Next.js request/response lifecycles.
 */
import { WebSocket, WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import { buildCombinedStreamUrl, BinanceTickerEvent } from "../../lib/binance/client";
import { priceStore } from "../../lib/binance/price-store";
import {
  calculateUnrealizedPnl,
  checkTpSlLiquidation,
  calculateMargin,
  calculateLiquidationPrice,
} from "../../lib/trading/engine";
import { fillSpotLimitOrder } from "./fill-spot-order";

const prisma = new PrismaClient();
const PORT = Number(process.env.WS_PORT ?? 8080);
const ASSET_SYNC_INTERVAL_MS = 5_000;
const POSITION_CHECK_INTERVAL_MS = 2_000;
const BINANCE_RECONNECT_DELAY_MS = 3_000;

const wss = new WebSocketServer({ port: PORT });
console.log(`[ws] GTX market data relay listening on :${PORT}`);

const clients = new Set<WebSocket>();

wss.on("connection", (socket) => {
  clients.add(socket);
  console.log(`[ws] client connected (${clients.size} total)`);

  // Send an immediate snapshot so the UI doesn't wait for the next tick.
  if (priceStore.isReady()) {
    socket.send(JSON.stringify({ type: "snapshot", data: priceStore.all() }));
  }

  socket.on("close", () => {
    clients.delete(socket);
    console.log(`[ws] client disconnected (${clients.size} total)`);
  });

  socket.on("error", () => clients.delete(socket));
});

function broadcast(payload: unknown) {
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

// ---------------------------------------------------------------------------
// Binance upstream connection (auto-reconnecting)
// ---------------------------------------------------------------------------

function connectToBinance() {
  const url = buildCombinedStreamUrl();
  const upstream = new WebSocket(url);

  upstream.on("open", () => console.log("[ws] connected to Binance stream"));

  upstream.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString()) as { data: BinanceTickerEvent };
      const t = parsed.data;
      if (!t || t.e !== "24hrTicker") return;

      const snapshot = {
        symbol: t.s,
        price: parseFloat(t.c),
        changePercent24h: parseFloat(t.P),
        high24h: parseFloat(t.h),
        low24h: parseFloat(t.l),
        volume24h: parseFloat(t.v),
      };
      priceStore.set(snapshot);
      broadcast({ type: "ticker", data: snapshot });
    } catch (err) {
      console.error("[ws] failed to parse Binance message", err);
    }
  });

  upstream.on("close", () => {
    console.warn(
      `[ws] Binance stream closed, reconnecting in ${BINANCE_RECONNECT_DELAY_MS}ms`
    );
    setTimeout(connectToBinance, BINANCE_RECONNECT_DELAY_MS);
  });

  upstream.on("error", (err) => {
    console.error("[ws] Binance stream error", err.message);
    upstream.close();
  });
}

connectToBinance();

// ---------------------------------------------------------------------------
// Periodic: persist latest prices to Asset table
// ---------------------------------------------------------------------------

setInterval(async () => {
  const snapshots = priceStore.all();
  await Promise.all(
    snapshots
      .filter((s) => s.price > 0)
      .map((s) =>
        prisma.asset
          .update({
            where: { symbol: s.symbol },
            data: { lastPrice: s.price, change24h: s.changePercent24h },
          })
          .catch(() => void 0)
      )
  );
}, ASSET_SYNC_INTERVAL_MS);

// ---------------------------------------------------------------------------
// Periodic: TP / SL / liquidation engine
// ---------------------------------------------------------------------------

setInterval(async () => {
  const openPositions = await prisma.position.findMany({
    where: { status: "OPEN" },
    include: { asset: true },
  });

  for (const position of openPositions) {
    const currentPrice = priceStore.getPrice(position.asset.symbol);
    if (!currentPrice) continue;

    const check = checkTpSlLiquidation({
      side: position.side,
      currentPrice,
      takeProfit: position.takeProfit ? Number(position.takeProfit) : null,
      stopLoss: position.stopLoss ? Number(position.stopLoss) : null,
      liquidationPrice: position.liquidationPrice
        ? Number(position.liquidationPrice)
        : null,
    });

    if (!check.shouldClose) continue;

    const pnl = calculateUnrealizedPnl(
      position.side,
      Number(position.amount),
      Number(position.entryPrice),
      currentPrice
    );

    await prisma.$transaction(async (tx) => {
      await tx.position.update({
        where: { id: position.id },
        data: {
          status: "CLOSED",
          currentPrice,
          realizedPnl: pnl,
          closedAt: new Date(),
        },
      });

      await tx.trade.create({
        data: {
          userId: position.userId,
          assetId: position.assetId,
          positionId: position.id,
          side: position.side,
          amount: position.amount,
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          pnl,
          leverage: position.leverage,
        },
      });

      await tx.wallet.update({
        where: { userId: position.userId },
        data: { balance: { increment: Number(position.margin) + pnl } },
      });

      await tx.notification.create({
        data: {
          userId: position.userId,
          title: `Position closed: ${check.reason}`,
          message: `${position.asset.symbol} ${position.side} position closed at ${currentPrice} (${
            pnl >= 0 ? "+" : ""
          }${pnl.toFixed(2)} USDT)`,
        },
      });
    });

    console.log(
      `[ws] auto-closed position ${position.id} (${check.reason}) pnl=${pnl.toFixed(2)}`
    );
  }
}, POSITION_CHECK_INTERVAL_MS);

// ---------------------------------------------------------------------------
// Periodic: pending LIMIT order fill engine
// ---------------------------------------------------------------------------

setInterval(async () => {
  const pendingOrders = await prisma.order.findMany({
    where: { status: "PENDING", type: "LIMIT" },
    include: { asset: true },
  });

  for (const order of pendingOrders) {
    const currentPrice = priceStore.getPrice(order.asset.symbol);
    if (!currentPrice || !order.limitPrice) continue;

    const limitPrice = Number(order.limitPrice);
    // BUY limit fills when price drops to/through the limit; SELL limit fills
    // when price rises to/through the limit (standard limit-order semantics).
    const shouldFill =
      order.side === "BUY" ? currentPrice <= limitPrice : currentPrice >= limitPrice;
    if (!shouldFill) continue;

    const side = order.side === "BUY" ? "LONG" : "SHORT";
    const executionPrice = limitPrice;
    const margin = calculateMargin(Number(order.amount), executionPrice, order.leverage);
    const liquidationPrice = calculateLiquidationPrice(
      side,
      executionPrice,
      order.leverage
    );

    const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } });
    if (!wallet || Number(wallet.balance) < margin) {
      // Not enough margin anymore — cancel instead of filling.
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "FILLED", filledAt: new Date() },
      });

      await tx.position.create({
        data: {
          userId: order.userId,
          assetId: order.assetId,
          orderId: order.id,
          side,
          amount: order.amount,
          leverage: order.leverage,
          entryPrice: executionPrice,
          currentPrice: executionPrice,
          takeProfit: order.takeProfit,
          stopLoss: order.stopLoss,
          margin,
          liquidationPrice,
          status: "OPEN",
        },
      });

      await tx.wallet.update({
        where: { userId: order.userId },
        data: { balance: { decrement: margin } },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: "Limit order filled",
          message: `${order.asset.symbol} ${order.side} limit order filled at ${executionPrice}`,
        },
      });
    });

    console.log(`[ws] filled limit order ${order.id} at ${executionPrice}`);
  }
}, POSITION_CHECK_INTERVAL_MS);

// ---------------------------------------------------------------------------
// Periodic: spot OPEN limit order fill engine
//
// Entirely separate from the futures pending-LIMIT-order loop above: spot
// orders settle against SpotWallet (per-currency balance/locked), not the
// futures margin Wallet, and have no leverage/position to open.
// ---------------------------------------------------------------------------

setInterval(async () => {
  try {
    const openOrders = await prisma.spotOrder.findMany({
      where: { status: "OPEN", type: "LIMIT" },
    });
    if (openOrders.length === 0) return;

    const symbols = [...new Set(openOrders.map((o) => o.symbol))];
    const assets = await prisma.asset.findMany({ where: { symbol: { in: symbols } } });
    const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));

    for (const order of openOrders) {
      const asset = assetBySymbol.get(order.symbol);
      const currentPrice = priceStore.getPrice(order.symbol);
      if (!asset || !currentPrice) continue;

      const outcome = await fillSpotLimitOrder(prisma, order, {
        currentPrice,
        baseCurrency: asset.baseAsset,
        quoteCurrency: asset.quoteAsset,
      });

      if (outcome === "filled") {
        console.log(
          `[ws] filled spot limit order ${order.id} (${order.symbol} ${order.side}) at ${order.price}`
        );
      }
    }
  } catch (err) {
    // A transient DB hiccup here must not crash the whole process — the
    // other loops (TP/SL, futures limit fills, price sync) share this
    // same event loop and would go down with it. Log and retry next tick.
    console.error("[ws] spot limit order fill tick failed", err);
  }
}, POSITION_CHECK_INTERVAL_MS);

process.on("SIGTERM", async () => {
  console.log("[ws] shutting down");
  await prisma.$disconnect();
  wss.close();
  process.exit(0);
});
