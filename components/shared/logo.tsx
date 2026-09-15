import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* The hexagon path's own points span y=1 to y=27 (26 units), but a
       *  "0 0 26 26" viewBox only covers y=0 to y=26 — the bottom vertex
       *  sat 1 unit past the viewBox edge before even accounting for the
       *  1.5px stroke, whose miter join at this 120° vertex extends the
       *  visible tip another ~0.87 unit beyond the path itself, so the
       *  bottom point was clipped by close to 2 units. viewBox/height
       *  below add 2 units of margin above AND below the path (symmetric
       *  around the path's own vertical center, y=14) at the same 1:1
       *  unit-to-pixel scale as before, so the hexagon itself renders at
       *  its original size — only the transparent breathing room around
       *  it grew, not the icon. */}
      <svg width="26" height="30" viewBox="0 -1 26 30" fill="none">
        <path
          d="M13 1L24.2583 7.5V20.5L13 27L1.74167 20.5V7.5L13 1Z"
          fill="#22C55E"
          fillOpacity="0.15"
          stroke="#22C55E"
          strokeWidth="1.5"
        />
        <path
          d="M8 13.5L11.5 17L18.5 9.5"
          stroke="#22C55E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-foreground">GTX</span>
    </div>
  );
}
