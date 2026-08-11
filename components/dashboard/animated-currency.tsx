"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function AnimatedCurrency({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 500;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    const frame = requestAnimationFrame(tick);
    prevValue.current = value;
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="font-tabular">{formatCurrency(display)}</span>;
}
