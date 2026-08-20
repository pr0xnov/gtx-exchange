import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Each token reads its RGB channels from a CSS custom property
        // (app/globals.css defines the light values on :root and the dark
        // values on .dark — toggled on <html> by lib/theme/theme-context.tsx)
        // via the rgb(var(...) / <alpha-value>) pattern, which is what lets
        // Tailwind's own opacity modifiers (bg-background/80, border-border/60,
        // bg-foreground/5, …) keep working unchanged across both themes —
        // a plain hex value can't respond to those. Every existing className
        // in the app already only ever uses these named tokens (never a raw
        // hex/rgb literal for anything structural), so this swap alone makes
        // the whole UI theme-aware with no per-component changes required.
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
          50: "#EAFBF0",
          500: "rgb(var(--color-primary) / <alpha-value>)",
          600: "rgb(var(--color-primary-hover) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          hover: "rgb(var(--color-danger-hover) / <alpha-value>)",
        },
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(34, 197, 94, 0.35)",
        card: "0 4px 24px -8px rgba(0, 0, 0, 0.4)",
        elevated: "0 8px 32px -12px rgba(0, 0, 0, 0.55)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "green-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(34,197,94,0.18) 0%, rgba(11,15,23,0) 70%)",
      },
      keyframes: {
        "flash-green": {
          "0%": { backgroundColor: "rgba(34,197,94,0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-red": {
          "0%": { backgroundColor: "rgba(239,68,68,0.25)" },
          "100%": { backgroundColor: "transparent" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "flash-green": "flash-green 0.6s ease-out",
        "flash-red": "flash-red 0.6s ease-out",
        "fade-up": "fade-up 0.5s ease-out",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
