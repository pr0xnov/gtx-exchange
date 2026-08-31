"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  USDT_NETWORK_CODES,
  USDT_NETWORKS,
  type UsdtNetwork,
} from "@/lib/deposit/usdt-networks";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * A native <select> (not a custom listbox) styled to match Input's own
 * classes — the simplest, most accessible way to offer 3 fixed options,
 * with the chevron icon overlaid since appearance-none hides the
 * browser's own arrow. `value` is "" while no network has been picked
 * yet (see deposit-form.tsx: the address/QR card only renders once this
 * is a real UsdtNetwork).
 */
export function NetworkSelector({
  value,
  onChange,
}: {
  value: UsdtNetwork | "";
  onChange: (network: UsdtNetwork) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as UsdtNetwork)}
        className={cn(
          "flex h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm text-foreground transition-colors",
          "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        )}
      >
        <option value="" disabled>
          {t("deposit.selectNetworkPlaceholder")}
        </option>
        {USDT_NETWORK_CODES.map((code) => (
          <option key={code} value={code}>
            {USDT_NETWORKS[code].label} — {USDT_NETWORKS[code].description}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
