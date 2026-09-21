"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Replaces a plain native <select> (see components/dashboard/settings/
 * preferences-section.tsx) — a native select's open dropdown is OS/browser
 * chrome, not page content: it can't be styled, and in emulated/headless
 * Chromium (DevTools device mode, Playwright) it doesn't reliably respect
 * the emulated viewport width at all, which is what let it render wider
 * than a 320-440px mobile viewport. Select.Content below is real DOM,
 * positioned via Radix's Popper primitive (same one DropdownMenu already
 * uses for navbar.tsx's LanguageDropdown/AccountDropdown) — it clamps to
 * the actual viewport with collision detection, and exposes its own
 * matched-trigger-width and available-height as CSS vars, used below.
 */
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 text-sm text-foreground transition-colors",
      "hover:border-muted focus:outline-none focus:ring-2 focus:ring-primary/40",
      "data-[state=open]:border-muted",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", sideOffset = 6, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn(
        "z-50 overflow-hidden rounded-xl border border-border bg-card shadow-card",
        "data-[state=closed]:pointer-events-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        // Matches the trigger's own width (never wider than its parent
        // field, never wider than the viewport) and caps height to
        // whatever room Popper actually found before it would collide
        // with the viewport edge — this is what keeps a long list (e.g.
        // 8 languages) from ever pushing the page wider or taller than
        // the screen; scrolls internally instead (see Viewport below).
        position === "popper" &&
          "max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)]",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="max-h-[inherit] overflow-y-auto p-1.5">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "flex w-full cursor-pointer select-none items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors",
      "data-[highlighted]:bg-foreground/5 data-[highlighted]:text-foreground",
      "data-[state=checked]:text-foreground",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator>
      <Check className="h-4 w-4 shrink-0 text-primary" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
