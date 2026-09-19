"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared slide-in overlay shell for the mobile Navigation and Account
 * drawers (components/layout/mobile-nav-drawer.tsx,
 * mobile-account-drawer.tsx) — deliberately NOT built on Radix Dialog:
 * these are simple tap-triggered panels with no positioning/anchor logic,
 * so a plain fixed overlay + CSS transition avoids pulling in Popper/
 * focus-scope machinery a drawer doesn't need. Locks background scroll
 * while open and restores it on close/unmount, closes on Escape or a tap
 * on the backdrop, and uses 100dvh so mobile browser chrome showing/
 * hiding never clips the panel the way 100vh can.
 *
 * Portals to document.body rather than rendering inline where Navbar
 * mounts it (inside <header>, which is `position: sticky` with its own
 * z-index — a real stacking context). Confirmed live: nested that way,
 * the panel's geometry (fixed inset-0, correct rect) was fine, but page
 * content *underneath* it still won hit-testing (elementFromPoint at a
 * point inside the panel returned a Wallet-page element, not the panel),
 * because the panel's own z-[60] only reorders it among header's other
 * children — the whole header subtree still composites as one z:50 layer,
 * and apparently that isn't guaranteed to out-rank <main> the way plain
 * stacking-context theory suggests once page content grows tall/complex.
 * Portaling to body sidesteps ancestor stacking entirely, the same way
 * Radix's own DropdownMenu.Portal already does elsewhere in this file's
 * sibling desktop dropdowns.
 *
 * Starts below the header (top-[HEADER_OFFSET], not top-0) rather than
 * covering it: Navbar's header is z-[65], above this drawer's z-[60], so
 * its hamburger/profile button stays visible and tappable — the button
 * showing Menu/X (or the account icon) *is* this drawer's open/close
 * control, not just its trigger, so the header must never be covered
 * while the drawer it belongs to is open. Also means this panel's own
 * title/close row never fights the real header for the same pixels.
 */
const HEADER_OFFSET = "calc(4rem + env(safe-area-inset-top, 0px))";
export function MobileDrawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // document.body doesn't exist during SSR — only portal once mounted on
  // the client, same guard Radix's own Portal uses internally.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        // overflow-hidden here (not on body/html — never a global mask)
        // is load-bearing: this container is exactly viewport-sized
        // (fixed inset-0), but the closed panel below still sits just
        // past its right/left edge via `translate-x-full` — a `fixed`
        // element's post-transform box still expands
        // document.documentElement.scrollWidth in Chromium even though
        // it's positioned off-screen, which showed up as real horizontal
        // page overflow at every mobile width. Clipping it right here,
        // at the one viewport-sized ancestor, contains it without
        // affecting any other element's overflow behavior.
        "fixed inset-0 z-[60] overflow-hidden lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex w-[85%] max-w-sm flex-col bg-background shadow-elevated transition-transform duration-200 ease-out",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full"
        )}
        style={{
          top: HEADER_OFFSET,
          height: `calc(100dvh - ${HEADER_OFFSET})`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
