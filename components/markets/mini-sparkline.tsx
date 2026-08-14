import { cn } from "@/lib/utils";

export function MiniSparkline({
  positive = true,
  prices,
  className,
}: {
  positive?: boolean;
  /** Real recent-price series (e.g. hourly closes) to plot. When omitted,
   *  falls back to the original fixed demo path — unchanged for existing
   *  callers that never had real data to plot. */
  prices?: number[];
  className?: string;
}) {
  let points: string;
  let up = positive;

  if (prices && prices.length >= 2) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const step = 100 / (prices.length - 1);
    points = prices
      .map(
        (p, i) => `${(i * step).toFixed(2)},${(24 - ((p - min) / range) * 24).toFixed(2)}`
      )
      .join(" ");
    up = prices[prices.length - 1]! >= prices[0]!;
  } else {
    // Deterministic pseudo-random path so it's stable across renders.
    points = positive
      ? "0,20 10,18 20,14 30,16 40,10 50,12 60,6 70,8 80,3 90,5 100,1"
      : "0,4 10,6 20,5 30,9 40,7 50,12 60,10 70,15 80,13 90,18 100,20";
  }

  return (
    <svg
      viewBox="0 0 100 24"
      className={cn("h-6 w-full", className)}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={up ? "#22C55E" : "#EF4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
