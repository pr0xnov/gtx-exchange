import type { SupportCategory } from "@prisma/client";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

/** Fixed list a user picks from before their first message (see
 *  SupportCategory in prisma/schema.prisma) — order here is the order
 *  shown in the picker and matches the spec's own list. Each category's
 *  label lives in the dictionary under supportChat.category.* so the
 *  admin panel (English-only UI, like the rest of /admin) and the
 *  user-facing widget (localized) can both resolve a label from the same
 *  stored enum value without duplicating the list. */
export const SUPPORT_CATEGORIES: readonly SupportCategory[] = [
  "DEPOSIT",
  "WITHDRAWAL",
  "TRADING",
  "VERIFICATION",
  "BONUSES",
  "SECURITY",
  "OTHER",
];

export const SUPPORT_CATEGORY_LABEL_KEYS: Record<SupportCategory, DictionaryKey> = {
  DEPOSIT: "supportChat.category.deposit",
  WITHDRAWAL: "supportChat.category.withdrawal",
  TRADING: "supportChat.category.trading",
  VERIFICATION: "supportChat.category.verification",
  BONUSES: "supportChat.category.bonuses",
  SECURITY: "supportChat.category.security",
  OTHER: "supportChat.category.other",
};

/** Plain English labels for the Admin Panel, which (like every other
 *  /admin page in this app) isn't localized. */
export const SUPPORT_CATEGORY_ADMIN_LABEL: Record<SupportCategory, string> = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  TRADING: "Trading",
  VERIFICATION: "Verification",
  BONUSES: "Bonuses",
  SECURITY: "Security",
  OTHER: "Other",
};
