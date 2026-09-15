import { cn } from "@/lib/utils";

/**
 * The exact green-glow/grid-fade hero background originally written for
 * /contacts (see app/(marketing)/contacts/page.tsx's own git history) —
 * extracted here so /wallet, /markets and /analytics can reuse the same
 * design system without copy-pasting the markup. `bg-green-glow` and
 * `bg-grid-fade` are pre-existing shared Tailwind background-image
 * utilities (see tailwind.config.ts), not something defined for this
 * component — so this really is just the layout/typography shell around
 * them, unchanged from /contacts.
 *
 * `compact` swaps /contacts' own py-20 for a shorter py-10 sm:py-12 — for
 * a page whose real content (balances, market data, charts) needs to stay
 * comfortably above the fold, not /contacts' own large vertical space
 * before its cards. /contacts itself always renders with compact={false}
 * so its appearance is byte-for-byte what it was before this component
 * existed.
 */
export function PageHero({
  title,
  subtitle,
  compact = false,
}: {
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-green-glow">
      <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div
        className={cn(
          "container relative text-center",
          compact ? "py-10 sm:py-12" : "py-20"
        )}
      >
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
