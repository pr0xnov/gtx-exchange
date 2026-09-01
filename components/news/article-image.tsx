"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Article images come straight from external RSS feeds (arbitrary,
 * ever-changing CDN domains — sanity.io, ctmedia.io, decrypt.co, etc.),
 * so this deliberately renders a plain <img> rather than next/image:
 * next/image would need every one of those domains added to
 * next.config's remotePatterns, and there's no fixed list to add (spec:
 * "no wildcard for every domain without a reason"). A broken/blocked
 * external URL just falls back to the GTX placeholder via onError,
 * never a broken image icon.
 */
export function ArticleImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-surface to-card",
          className
        )}
      >
        <div className="flex flex-col items-center gap-1.5 text-primary/50">
          <Newspaper className="h-7 w-7" />
          <span className="text-[10px] font-bold tracking-widest">GTX</span>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
