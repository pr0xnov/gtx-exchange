import { cn } from "@/lib/utils";

export function InfoPanel({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
