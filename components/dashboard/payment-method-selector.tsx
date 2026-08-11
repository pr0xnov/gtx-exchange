"use client";

import { CreditCard, Landmark, Bitcoin, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export const PAYMENT_METHODS = [
  { id: "VISA_MASTERCARD", label: "Visa / Mastercard", sub: "2-5 business days", icon: CreditCard },
  { id: "BANK_TRANSFER", label: "Bank Transfer", sub: "2-5 business days", icon: Landmark },
  { id: "BITCOIN", label: "Bitcoin", sub: "Within 24 hours", icon: Bitcoin },
  { id: "TETHER_USDT", label: "Tether (USDT)", sub: "Within 24 hours", icon: DollarSign },
] as const;

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
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
                : "border-border bg-surface hover:border-white/20"
            )}
          >
            <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted")} />
            <div className="text-xs font-medium text-foreground">{method.label}</div>
            <div className="text-[10px] text-muted">{method.sub}</div>
          </button>
        );
      })}
    </div>
  );
}
