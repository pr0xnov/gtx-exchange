// @vitest-environment jsdom
/**
 * Verifies useFavorites(enabled) never reads or writes localStorage at
 * all while `enabled` is false (the guest case) — checked against the
 * real jsdom localStorage's actual contents (more direct than a spy
 * call-count, and avoids jsdom/vitest quirks around spying methods that
 * live on Storage.prototype rather than the instance), per the "Guest
 * does NOT access favorites state/localStorage" requirement.
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo) — same low-level approach as the other Markets component
 * tests.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFavorites } from "@/hooks/use-favorites";
import { FAVORITES_STORAGE_KEY, serializeFavorites } from "@/lib/markets/favorites";

let container: HTMLDivElement;
let root: Root;

let lastToggle: ((symbol: string) => void) | null = null;
let lastFavorites: Set<string> = new Set();

function Harness({ enabled }: { enabled: boolean }) {
  const { favorites, toggleFavorite } = useFavorites(enabled);
  lastToggle = toggleFavorite;
  lastFavorites = favorites;
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(enabled: boolean) {
  act(() => {
    root.render(React.createElement(Harness, { enabled }));
  });
}

describe("useFavorites — guest (enabled=false)", () => {
  it("never reads a pre-existing favorites entry from localStorage", () => {
    // Seed storage as if a previous authenticated session left favorites
    // behind — a guest must never pick these up.
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      serializeFavorites(new Set(["BTCUSDT"]))
    );
    render(false);
    expect(lastFavorites.size).toBe(0);
  });

  it("never writes to localStorage when toggleFavorite is called", () => {
    render(false);
    act(() => lastToggle!("BTCUSDT"));
    expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBeNull();
  });

  it("toggleFavorite is a no-op — favorites stays empty", () => {
    render(false);
    act(() => lastToggle!("BTCUSDT"));
    expect(lastFavorites.size).toBe(0);
  });
});

describe("useFavorites — authenticated (enabled=true)", () => {
  it("reads an existing favorites entry from localStorage on mount", () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      serializeFavorites(new Set(["BTCUSDT"]))
    );
    render(true);
    expect(lastFavorites.has("BTCUSDT")).toBe(true);
  });

  it("writes localStorage when toggleFavorite is called, and updates favorites", () => {
    render(true);
    act(() => lastToggle!("BTCUSDT"));
    expect(lastFavorites.has("BTCUSDT")).toBe(true);
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(["BTCUSDT"]);
  });

  it("persists across a remount (simulating reload) via the same storage key", () => {
    render(true);
    act(() => lastToggle!("BTCUSDT"));
    act(() => root.unmount());
    root = createRoot(container);
    render(true);
    expect(lastFavorites.has("BTCUSDT")).toBe(true);
  });
});
