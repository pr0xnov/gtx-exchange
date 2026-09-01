import { describe, expect, it } from "vitest";
import { categorizeArticle } from "@/lib/news/categories";

describe("categorizeArticle", () => {
  it("matches Bitcoin from BTC or Bitcoin keywords", () => {
    expect(categorizeArticle("Bitcoin hits new high", "")).toBe("bitcoin");
    expect(categorizeArticle("BTC breaks $100k", "")).toBe("bitcoin");
  });

  it("matches Ethereum from ETH or Ethereum keywords", () => {
    expect(categorizeArticle("Ethereum upgrade goes live", "")).toBe("ethereum");
    expect(categorizeArticle("ETH gas fees drop", "")).toBe("ethereum");
  });

  it("matches DeFi from DeFi-related keywords", () => {
    expect(categorizeArticle("New DeFi protocol launches", "")).toBe("defi");
    expect(
      categorizeArticle("Liquidity pool exploited", "decentralized finance risk")
    ).toBe("defi");
  });

  it("matches Regulation from regulatory/legal keywords", () => {
    expect(categorizeArticle("SEC sues exchange", "")).toBe("regulation");
    expect(categorizeArticle("New crypto legislation passes Congress", "")).toBe(
      "regulation"
    );
  });

  it("falls back to Altcoins when nothing matches", () => {
    expect(categorizeArticle("Solana fees hit record low", "validators earn less")).toBe(
      "altcoins"
    );
  });

  it("checks title and description together", () => {
    expect(categorizeArticle("Market update", "Bitcoin leads the rally")).toBe("bitcoin");
  });

  it("is case-insensitive", () => {
    expect(categorizeArticle("bitcoin surges", "")).toBe("bitcoin");
    expect(categorizeArticle("ETHEREUM MERGE", "")).toBe("ethereum");
  });

  it("does not match substrings inside unrelated words", () => {
    // "ETH" must not match inside "method" or "meth-something"
    expect(categorizeArticle("A new method for trading", "")).not.toBe("ethereum");
  });
});
