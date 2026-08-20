"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { ThemeProvider, useTheme } from "@/lib/theme/theme-context";
import type { Theme } from "@/lib/theme/config";

/** Reads theme via useTheme() (must be a ThemeProvider descendant, not a
 *  sibling) so toast styling flips instantly with the rest of the app —
 *  no separate toast-specific theme state. */
function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      toastOptions={{
        style:
          theme === "dark"
            ? {
                background: "#131A23",
                border: "1px solid #1F2937",
                color: "#F3F4F6",
              }
            : {
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                color: "#111827",
              },
      }}
    />
  );
}

export function Providers({
  children,
  initialLocale,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  initialTheme: Theme;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <LocaleProvider initialLocale={initialLocale}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ThemedToaster />
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
