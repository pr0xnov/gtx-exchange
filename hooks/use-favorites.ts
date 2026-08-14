"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FAVORITES_STORAGE_KEY,
  parseFavorites,
  serializeFavorites,
  toggleFavoriteSet,
} from "@/lib/markets/favorites";

/**
 * Favorited symbols for the /markets "Избранные" tab, persisted to
 * localStorage — an authenticated-account feature. `enabled` gates every
 * touch of localStorage (read on mount, write on toggle): a guest
 * (`enabled=false`) never has this hook read from or write to storage at
 * all, and `favorites` simply stays an empty Set for the whole session.
 *
 * When enabled, it still starts as an empty set on every render (server
 * and first client render alike) and is only populated from localStorage
 * inside an effect — i.e. after mount — so SSR output and the first
 * client paint always agree and there's no hydration mismatch.
 */
export function useFavorites(enabled: boolean) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    setFavorites(parseFavorites(window.localStorage.getItem(FAVORITES_STORAGE_KEY)));
  }, [enabled]);

  const toggleFavorite = useCallback(
    (symbol: string) => {
      if (!enabled) return;
      setFavorites((prev) => {
        const next = toggleFavoriteSet(prev, symbol);
        try {
          window.localStorage.setItem(FAVORITES_STORAGE_KEY, serializeFavorites(next));
        } catch {
          // Storage unavailable (private mode, quota) — favorites still
          // work for the rest of this session, just won't persist.
        }
        return next;
      });
    },
    [enabled]
  );

  return { favorites, toggleFavorite };
}
