import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "danger" | "pending" | "muted";
}) {
  const variants = {
    default: "bg-white/10 text-foreground",
    success: "bg-primary/15 text-primary",
    danger: "bg-danger/15 text-danger",
    pending: "bg-amber-500/15 text-amber-400",
    muted: "bg-white/5 text-muted",
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
