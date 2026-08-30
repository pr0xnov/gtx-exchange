"use client";

import { useEffect, useState } from "react";
import { useQueries, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { closesFromCandles } from "@/lib/markets/derive";
import type { Candle } from "@/lib/binance/client";
import { refreshAccessToken } from "@/lib/auth/client-refresh";
import {
  deriveWalletFinancials,
  type DerivedWalletFinancials,
} from "@/lib/account/derive";

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

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  isRetry = false
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  // Access token expired (15m) but the refresh token may still be valid —
  // refresh once and replay this exact request, so a session that's still
  // good never surfaces as "logged out" mid-use. `isRetry` guards against
  // looping if the retried request 401s again (e.g. the refresh token is
  // also expired/revoked) — that's a real logout, not something to retry.
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return fetchJson<T>(url, init, true);
  }

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
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  accountType: string;
  leverageMax: number;
  wallet: { balance: string; credit: string; currency: string } | null;
  createdAt: string;
  verification: "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";
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
  /** Sum of Trade.pnl (closed futures trades) — already folded into
   *  `balance`; reported separately for display (e.g. Account's Profit
   *  card), not to be added into balance/equity again. */
  realizedPnl: number;
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
  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "BONUS"
    | "TRADE_SETTLEMENT"
    | "ADMIN_BALANCE_ADJUSTMENT";
  method: string | null;
  amount: string;
  asset: string;
  direction: "CREDIT" | "DEBIT" | null;
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
      queryClient.invalidateQueries({ queryKey: ["account-summary"] });
    },
  });
}

export interface SpotAssetSummaryDto {
  currency: string;
  symbol: string;
  amount: number;
  currentPrice: number;
  value: number;
  costBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface AccountSummaryDto {
  balance: number;
  equity: number;
  profit: number;
  spotAssets: SpotAssetSummaryDto[];
}

/**
 * The one shared source of Balance/Equity/Profit for Account, Wallet,
 * and Trading's header — see app/api/account/summary/route.ts and
 * lib/account/derive.ts. Every consumer of this hook sees the same
 * numbers, computed the same way, from the same price snapshot.
 */
export function useAccountSummary() {
  return useQuery({
    queryKey: ["account-summary"],
    queryFn: () => fetchJson<AccountSummaryDto>("/api/account/summary"),
    refetchInterval: 5000,
  });
}

export interface WalletFinancials extends DerivedWalletFinancials {
  isLoading: boolean;
}

const QUOTE_CURRENCY = "USDT";

/**
 * The single source of Available Balance / In Orders / Assets Value /
 * Profit-Loss for both Wallet and Trading's header — composed from the
 * same two existing queries (useAccountSummary + useSpotWallet) every
 * other balance-aware component already reads, so the two pages can
 * never quietly disagree and no third, parallel financial source is
 * introduced. The actual arithmetic is lib/account/derive.ts's
 * deriveWalletFinancials, a plain function so it's unit-testable
 * without React Query — this hook only wires it to live query data.
 */
export function useWalletFinancials(): WalletFinancials {
  const { data: summary, isLoading: summaryLoading } = useAccountSummary();
  const { data: spotWallets, isLoading: walletLoading } = useSpotWallet();

  const usdtWallet = spotWallets?.find((w) => w.currency === QUOTE_CURRENCY);

  return {
    ...deriveWalletFinancials({
      usdtBalance: usdtWallet?.balance,
      usdtLocked: usdtWallet?.locked,
      spotCurrencies: summary?.spotAssets ?? [],
      profit: summary?.profit ?? 0,
    }),
    isLoading: summaryLoading || walletLoading,
  };
}

export interface VerificationDocumentDto {
  id: string;
  type: "IDENTITY" | "PROOF_OF_ADDRESS";
  fileName: string;
  mimeType: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  uploadedAt: string;
}

export interface VerificationStatusDto {
  status: "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";
  rejectionReason: string | null;
  profile: {
    fullName: string;
    email: string;
    country: string | null;
    dateOfBirth: string | null;
    address: string | null;
  };
  documents: VerificationDocumentDto[];
}

export function useVerificationStatus() {
  return useQuery({
    queryKey: ["verification"],
    queryFn: () => fetchJson<VerificationStatusDto>("/api/verification"),
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
      queryClient.invalidateQueries({ queryKey: ["account-summary"] });
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
      // A withdrawal debits SpotWallet immediately (see app/api/withdraw/
      // route.ts) — without these, the Wallet page / Withdrawal form's own
      // balance check (useAccountSummary / useSpotWallet) would keep
      // showing the pre-withdrawal amount until their next poll (up to
      // 5s), same pair useCancelSpotOrder() already invalidates for the
      // same reason.
      queryClient.invalidateQueries({ queryKey: ["spot-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account-summary"] });
    },
  });
}

// ---------------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------------

export interface UserSettingsDto {
  language: string;
  theme: string;
  twoFactorOn: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyMarket: boolean;
}

export interface SettingsDto {
  firstName: string;
  lastName: string;
  email: string;
  pendingEmail: string | null;
  settings: UserSettingsDto;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchJson<SettingsDto>("/api/settings"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { firstName: string; lastName: string }) =>
      fetchJson("/api/settings/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) =>
      fetchJson("/api/settings/password", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useRequestEmailChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { newEmail: string; currentPassword: string }) =>
      fetchJson<{ pendingEmail: string }>("/api/settings/email/request", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Partial<
        Pick<UserSettingsDto, "notifyEmail" | "notifyPush" | "notifyMarket">
      >
    ) =>
      fetchJson<UserSettingsDto>("/api/settings/preferences", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export interface TwoFaSetupDto {
  qrCodeDataUrl: string;
  secret: string;
  setupToken: string;
}

export function useSetup2FA() {
  return useMutation({
    mutationFn: () =>
      fetchJson<TwoFaSetupDto>("/api/settings/2fa/setup", { method: "POST" }),
  });
}

export function useEnable2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { setupToken: string; code: string }) =>
      fetchJson("/api/settings/2fa/enable", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { code: string }) =>
      fetchJson("/api/settings/2fa/disable", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
