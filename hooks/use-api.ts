"use client";

import { useEffect, useState } from "react";
import { useQueries, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { closesFromCandles } from "@/lib/markets/derive";
import type { Candle } from "@/lib/binance/client";

// Sparkline requests are one-shot (not polled) but there can now be up to
// ~100 tracked symbols — firing that many /api/markets/klines calls at
// once on mount would be its own mini stampede. Reveal symbols to
// useQueries in small batches instead, so at most SPARKLINE_BATCH_SIZE
// requests are ever in flight at a time; each batch is still cached for
// 5 minutes, so this cost is paid once per Markets visit, not repeated.
const SPARKLINE_BATCH_SIZE = 10;
const SPARKLINE_BATCH_DELAY_MS = 150;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  accountType: string;
  leverageMax: number;
  wallet: { balance: string; credit: string; currency: string } | null;
  createdAt: string;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => fetchJson<CurrentUser>("/api/user"),
    retry: false,
  });
}

export interface PortfolioSummary {
  balance: number;
  credit: number;
  equity: number;
  unrealizedPnl: number;
  usedMargin: number;
  freeMargin: number;
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => fetchJson<PortfolioSummary>("/api/portfolio"),
    refetchInterval: 3000,
  });
}

export interface PositionDto {
  id: string;
  symbol: string;
  displaySymbol: string;
  side: "LONG" | "SHORT";
  amount: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  takeProfit: number | null;
  stopLoss: number | null;
  margin: number;
  liquidationPrice: number | null;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
}

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: () => fetchJson<PositionDto[]>("/api/positions"),
    refetchInterval: 2000,
  });
}

export interface MarketAsset {
  id: string;
  symbol: string;
  displaySymbol: string;
  category: string;
  price: number;
  change24h: number;
}

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => fetchJson<MarketAsset[]>("/api/markets"),
    refetchInterval: 3000,
  });
}

/**
 * Recent-closes series per symbol for the Markets "График" sparkline
 * column, via the same /api/markets/klines endpoint Trading already
 * uses for the main chart — just a small one-shot request per symbol
 * (24 hourly candles), cached for 5 minutes, no polling. Called once at
 * the top of MarketsClient with the full tracked-symbol list, so every
 * block on the page shares these same cached results.
 */
export function useSparklines(symbols: readonly string[]): Record<string, number[]> {
  const [batchSize, setBatchSize] = useState(() =>
    Math.min(SPARKLINE_BATCH_SIZE, symbols.length)
  );

  useEffect(() => {
    setBatchSize(Math.min(SPARKLINE_BATCH_SIZE, symbols.length));
    if (symbols.length <= SPARKLINE_BATCH_SIZE) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function revealNextBatch(revealed: number) {
      if (cancelled || revealed >= symbols.length) return;
      const next = Math.min(revealed + SPARKLINE_BATCH_SIZE, symbols.length);
      setBatchSize(next);
      if (next < symbols.length) {
        timer = setTimeout(() => revealNextBatch(next), SPARKLINE_BATCH_DELAY_MS);
      }
    }
    timer = setTimeout(
      () => revealNextBatch(SPARKLINE_BATCH_SIZE),
      SPARKLINE_BATCH_DELAY_MS
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // symbols is a module-level constant list (TRACKED_SYMBOLS) in every
    // real caller — keying off its length is enough to restart batching
    // if a genuinely different list is ever passed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.length]);

  const activeSymbols = symbols.slice(0, batchSize);

  const results = useQueries({
    queries: activeSymbols.map((symbol) => ({
      queryKey: ["markets", "sparkline", symbol],
      queryFn: () =>
        fetchJson<Candle[]>(`/api/markets/klines?symbol=${symbol}&interval=1h&limit=24`),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const bySymbol: Record<string, number[]> = {};
  activeSymbols.forEach((symbol, i) => {
    const candles = results[i]?.data;
    if (candles) bySymbol[symbol] = closesFromCandles(candles);
  });
  return bySymbol;
}

export interface TransactionDto {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "BONUS" | "TRADE_SETTLEMENT";
  method: string | null;
  amount: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

export function useHistory(filter: string) {
  return useQuery({
    queryKey: ["history", filter],
    queryFn: () => fetchJson<TransactionDto[]>(`/api/history?filter=${filter}`),
  });
}

export interface OrderDto {
  id: string;
  type: "MARKET" | "LIMIT";
  side: "BUY" | "SELL";
  amount: string;
  leverage: number;
  limitPrice: string | null;
  takeProfit: string | null;
  stopLoss: string | null;
  status: "PENDING" | "FILLED" | "CANCELLED";
  createdAt: string;
  asset: { symbol: string; displaySymbol: string };
}

export function usePendingOrders() {
  return useQuery({
    queryKey: ["orders", "pending"],
    queryFn: () => fetchJson<OrderDto[]>("/api/orders"),
    select: (orders) => orders.filter((o) => o.status === "PENDING"),
    refetchInterval: 3000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      fetchJson(`/api/orders/${orderId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      symbol: string;
      type: "MARKET" | "LIMIT";
      side: "BUY" | "SELL";
      amount: number;
      leverage: number;
      limitPrice?: number;
      takeProfit?: number;
      stopLoss?: number;
    }) => fetchJson("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (positionId: string) =>
      fetchJson("/api/orders/close", {
        method: "POST",
        body: JSON.stringify({ positionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export interface SpotWalletDto {
  currency: string;
  balance: number;
  locked: number;
}

export function useSpotWallet() {
  return useQuery({
    queryKey: ["spot-wallet"],
    queryFn: () => fetchJson<SpotWalletDto[]>("/api/spot/wallet"),
    refetchInterval: 5000,
  });
}

export interface SpotOrderDto {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price: string;
  quantity: string;
  filledQuantity: string;
  status: "OPEN" | "FILLED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export function useSpotOrders() {
  return useQuery({
    queryKey: ["spot-orders"],
    queryFn: () => fetchJson<SpotOrderDto[]>("/api/spot/orders"),
    refetchInterval: 3000,
  });
}

export function useCreateSpotOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      symbol: string;
      side: "BUY" | "SELL";
      type: "MARKET" | "LIMIT";
      quantity: number;
      price?: number;
    }) =>
      fetchJson("/api/spot/orders", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spot-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["spot-orders"] });
    },
  });
}

export function useCancelSpotOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      fetchJson(`/api/spot/orders/${orderId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spot-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["spot-orders"] });
    },
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; method: string }) =>
      fetchJson("/api/deposit", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; method: string }) =>
      fetchJson("/api/withdraw", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
