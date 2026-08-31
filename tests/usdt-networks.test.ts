/**
 * Unit tests for lib/deposit/usdt-networks.ts — the three fixed,
 * manually-provided USDT deposit addresses. These values must never
 * drift: they were given explicitly, not generated, so this test pins
 * them exactly rather than just checking "looks like an address".
 */
import { describe, expect, it } from "vitest";
import {
  USDT_NETWORK_CODES,
  USDT_NETWORKS,
  isUsdtNetwork,
} from "@/lib/deposit/usdt-networks";

describe("USDT_NETWORKS — exact given addresses", () => {
  it("BSC — BNB Smart Chain (BEP20)", () => {
    expect(USDT_NETWORKS.BSC).toEqual({
      label: "BSC",
      description: "BNB Smart Chain (BEP20)",
      address: "0xe8c7c0815b3641cf74e78e2da933072aae348a58",
    });
  });

  it("TRX — Tron (TRC20)", () => {
    expect(USDT_NETWORKS.TRX).toEqual({
      label: "TRX",
      description: "Tron (TRC20)",
      address: "TG6mGd9J5XjKzeg5HSmsXVDxTQNBakFzMe",
    });
  });

  it("ETH — Ethereum (ERC20)", () => {
    expect(USDT_NETWORKS.ETH).toEqual({
      label: "ETH",
      description: "Ethereum (ERC20)",
      address: "0xe8c7c0815b3641cf74e78e2da933072aae348a58",
    });
  });

  it("BSC and ETH deliberately share the same EVM address (both were given as identical)", () => {
    expect(USDT_NETWORKS.BSC.address).toBe(USDT_NETWORKS.ETH.address);
  });

  it("exactly three networks are configured, no more, no less", () => {
    expect(USDT_NETWORK_CODES).toEqual(["BSC", "TRX", "ETH"]);
    expect(Object.keys(USDT_NETWORKS)).toHaveLength(3);
  });
});

describe("isUsdtNetwork", () => {
  it("accepts BSC/TRX/ETH", () => {
    expect(isUsdtNetwork("BSC")).toBe(true);
    expect(isUsdtNetwork("TRX")).toBe(true);
    expect(isUsdtNetwork("ETH")).toBe(true);
  });

  it("rejects anything else, including an empty string or an unsupported network", () => {
    expect(isUsdtNetwork("")).toBe(false);
    expect(isUsdtNetwork("SOL")).toBe(false);
    expect(isUsdtNetwork("bsc")).toBe(false); // case-sensitive, no fuzzy matching
  });
});
