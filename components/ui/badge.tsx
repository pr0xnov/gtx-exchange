import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "danger" | "pending" | "muted" | "count";
}) {
  const variants = {
    default: "bg-foreground/10 text-foreground",
    success: "bg-primary/15 text-primary",
    danger: "bg-danger/15 text-danger",
    pending: "bg-amber-500/15 text-amber-400",
    muted: "bg-foreground/5 text-muted",
    // Solid (not tinted) — a pending-request count indicator, not a
    // status label; see components/admin/admin-sidebar.tsx and
    // app/admin/users/**.
    count: "bg-danger text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
