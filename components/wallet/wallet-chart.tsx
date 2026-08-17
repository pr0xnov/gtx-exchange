"use client";

import { useEffect, useRef, useState } from "react";
import { MiniSparkline } from "@/components/markets/mini-sparkline";

const MAX_SAMPLES = 60;

/**
 * There is no historical portfolio-value data anywhere in this backend —
 * no snapshot/equity-curve model or endpoint records a user's total
 * wallet value over time (only discrete Transaction/Trade events exist).
 * Rather than fabricate a backdated curve, this plots real equity values
 * sampled client-side as `value` actually changes during the current
 * session — it starts empty/flat on every fresh page load and only
 * grows a real line as balance/PnL genuinely move while the page stays
 * open. MiniSparkline's own placeholder path is deliberately NOT used
 * here (it draws a fixed fake demo curve when given fewer than 2 real
 * points), since that would be exactly the kind of invented data this
 * page must avoid.
 */
export function WalletChart({ value }: { value: number }) {
  const [samples, setSamples] = useState<number[]>([]);
  const lastValue = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(value) || lastValue.current === value) return;
    lastValue.current = value;
    setSamples((prev) => [...prev, value].slice(-MAX_SAMPLES));
  }, [value]);

  if (samples.length < 2) {
    return (
      <div className="flex h-10 items-center text-[11px] leading-tight text-muted">
        Value history will appear here as it changes during this session.
      </div>
    );
  }

  const positive = samples[samples.length - 1]! >= samples[0]!;
  return <MiniSparkline prices={samples} positive={positive} className="h-10" />;
}
