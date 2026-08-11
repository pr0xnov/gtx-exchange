import type { Config } from "tailwindcss";

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
        background: "#0B0F17",
        surface: "#111827",
        card: "#131A23",
        border: "#1F2937",
        primary: {
          DEFAULT: "#22C55E",
          hover: "#16A34A",
          foreground: "#0B0F17",
          50: "#EAFBF0",
          500: "#22C55E",
          600: "#16A34A",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
        },
        foreground: "#F3F4F6",
        muted: {
          DEFAULT: "#9CA3AF",
          foreground: "#6B7280",
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
  plugins: [require("tailwindcss-animate")],
};

export default config;
