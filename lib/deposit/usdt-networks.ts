/**
 * The three USDT deposit networks this platform accepts, each with its
 * own fixed, manually-provided public receiving address. These are NOT
 * generated or derived anywhere in this app — no wallet generation, no
 * private keys, no seed phrases exist near this file, only public
 * addresses safe to display and QR-encode. Do not change these values
 * or add new networks without being given a new address explicitly.
 *
 * Single source of truth for both the Deposit page (network selector +
 * address/QR card) and the Admin Panel's per-user Deposits tab (network
 * + address lookup from the stored network code) — see
 * components/dashboard/network-selector.tsx,
 * components/dashboard/deposit-address-card.tsx, and
 * app/admin/users/[id]/page.tsx.
 */

export const USDT_NETWORK_CODES = ["BSC", "TRX", "ETH"] as const;

export type UsdtNetwork = (typeof USDT_NETWORK_CODES)[number];

export interface UsdtNetworkConfig {
  label: string;
  description: string;
  address: string;
}

export const USDT_NETWORKS: Record<UsdtNetwork, UsdtNetworkConfig> = {
  BSC: {
    label: "BSC",
    description: "BNB Smart Chain (BEP20)",
    address: "0xe8c7c0815b3641cf74e78e2da933072aae348a58",
  },
  TRX: {
    label: "TRX",
    description: "Tron (TRC20)",
    address: "TG6mGd9J5XjKzeg5HSmsXVDxTQNBakFzMe",
  },
  ETH: {
    label: "ETH",
    description: "Ethereum (ERC20)",
    address: "0xe8c7c0815b3641cf74e78e2da933072aae348a58",
  },
};

export function isUsdtNetwork(value: string): value is UsdtNetwork {
  return (USDT_NETWORK_CODES as readonly string[]).includes(value);
}
