import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
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
