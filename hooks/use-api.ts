"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
