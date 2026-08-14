/**
 * Guards the "Избранные скрыта для гостя, видна авторизованному"
 * requirement at its actual mechanism: getVisibleTabs(isAuthenticated)
 * in markets-client.tsx, which MarketsClient's nav renders from
 * directly. This fails the moment "favorites" leaks back into the
 * guest list, or disappears from the authenticated list.
 */
import { describe, expect, it } from "vitest";
import { TABS, getVisibleTabs } from "@/components/markets/markets-client";

describe("getVisibleTabs", () => {
  it("guest (isAuthenticated=false) does not see Избранные", () => {
    const ids = getVisibleTabs(false).map((t) => t.id);
    expect(ids).not.toContain("favorites");
  });

  it("guest still sees every other section, unchanged", () => {
    expect(getVisibleTabs(false).map((t) => t.id)).toEqual([
      "all",
      "popular",
      "gainers",
      "losers",
      "volume",
      "movers",
    ]);
  });

  it("authenticated user sees Избранные, right after Все криптовалюты", () => {
    const ids = getVisibleTabs(true).map((t) => t.id);
    expect(ids).toContain("favorites");
    expect(ids.indexOf("favorites")).toBe(ids.indexOf("all") + 1);
  });

  it("authenticated user sees the full canonical tab list", () => {
    expect(getVisibleTabs(true)).toEqual(TABS);
  });
});
