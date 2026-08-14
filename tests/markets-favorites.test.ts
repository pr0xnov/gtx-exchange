/**
 * Unit tests for the pure favorites-set helpers (lib/markets/favorites.ts)
 * backing the /markets "Избранные" tab — add/remove/persistence
 * round-trip, with no React/DOM involved (hooks/use-favorites.ts is a
 * thin wrapper over these that's exercised indirectly by
 * markets-row-interactions.test.ts).
 */
import { describe, expect, it } from "vitest";
import {
  parseFavorites,
  serializeFavorites,
  toggleFavoriteSet,
} from "@/lib/markets/favorites";

describe("toggleFavoriteSet", () => {
  it("adds a symbol not already present", () => {
    const result = toggleFavoriteSet(new Set(), "BTCUSDT");
    expect(result.has("BTCUSDT")).toBe(true);
  });

  it("removes a symbol already present", () => {
    const result = toggleFavoriteSet(new Set(["BTCUSDT"]), "BTCUSDT");
    expect(result.has("BTCUSDT")).toBe(false);
  });

  it("never mutates the set it was given", () => {
    const original = new Set(["ETHUSDT"]);
    toggleFavoriteSet(original, "BTCUSDT");
    expect(original.has("BTCUSDT")).toBe(false);
    expect(original.size).toBe(1);
  });

  it("leaves other symbols untouched", () => {
    const result = toggleFavoriteSet(new Set(["ETHUSDT", "SOLUSDT"]), "BTCUSDT");
    expect([...result].sort()).toEqual(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
  });
});

describe("serializeFavorites / parseFavorites round-trip (persistence)", () => {
  it("round-trips a non-empty set through the same shape localStorage would store", () => {
    const original = new Set(["BTCUSDT", "ETHUSDT"]);
    const restored = parseFavorites(serializeFavorites(original));
    expect([...restored].sort()).toEqual(["BTCUSDT", "ETHUSDT"]);
  });

  it("round-trips an empty set", () => {
    const restored = parseFavorites(serializeFavorites(new Set()));
    expect(restored.size).toBe(0);
  });

  it("parses missing storage (first visit) as an empty set, not an error", () => {
    expect(parseFavorites(null).size).toBe(0);
  });

  it("parses corrupted storage as an empty set instead of throwing", () => {
    expect(parseFavorites("not json").size).toBe(0);
    expect(parseFavorites('{"not":"an array"}').size).toBe(0);
  });

  it("drops non-string entries from otherwise-valid JSON", () => {
    expect(parseFavorites('[1, 2, "BTCUSDT"]')).toEqual(new Set(["BTCUSDT"]));
  });
});
