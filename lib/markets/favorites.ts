/**
 * Pure favorites-set helpers backing the "Избранные" tab on /markets.
 * No React, no `window` — kept separate from hooks/use-favorites.ts so
 * the add/remove/persistence logic is testable without a DOM.
 *
 * There is no existing user-settings/favorites mechanism in this project
 * (checked the Prisma schema — UserSettings has language/theme/2FA/
 * notification flags, nothing favorites-related) and this stage
 * explicitly asks not to add a new Prisma table/backend for it, so this
 * persists to localStorage instead.
 */

export const FAVORITES_STORAGE_KEY = "gtx-markets-favorites";

export function toggleFavoriteSet(
  current: ReadonlySet<string>,
  symbol: string
): Set<string> {
  const next = new Set(current);
  if (next.has(symbol)) next.delete(symbol);
  else next.add(symbol);
  return next;
}

export function parseFavorites(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

export function serializeFavorites(favorites: ReadonlySet<string>): string {
  return JSON.stringify([...favorites]);
}
