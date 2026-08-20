import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "primary" && "text-primary",
            tone === "danger" && "text-danger",
            tone === "default" && "text-muted"
          )}
        />
      </div>
      <div className="font-tabular mt-2 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
