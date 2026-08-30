"use client";

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { DictionaryKey } from "@/lib/i18n/dictionaries";

// Only Tether (USDT) is offered on Deposit/Withdrawal for now — card/bank/
// Bitcoin removed. Kept as a (single-entry) list rather than inlining a
// fixed method, so this component's rendering/selection logic doesn't
// need to change at all.
export const PAYMENT_METHODS = [
  {
    id: "TETHER_USDT",
    labelKey: "deposit.paymentMethodTether" as DictionaryKey,
    subKey: "deposit.paymentMethodHoursEstimate" as DictionaryKey,
    icon: DollarSign,
  },
] as const;

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const active = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
              active
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:border-foreground/20"
            )}
          >
            <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted")} />
            <div className="text-xs font-medium text-foreground">
              {t(method.labelKey)}
            </div>
            <div className="text-[10px] text-muted">{t(method.subKey)}</div>
          </button>
        );
      })}
    </div>
  );
}
