import { Suspense } from "react";
import { TradingTerminal } from "@/components/trading/trading-terminal";
import { getServerTranslator } from "@/lib/i18n/get-locale";

function TerminalFallback({ text }: { text: string }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background text-sm text-muted">
      {text}
    </div>
  );
}

export default async function TradingPage() {
  const t = await getServerTranslator();
  return (
    <Suspense fallback={<TerminalFallback text={t("trading.page.loadingTerminal")} />}>
      <TradingTerminal />
    </Suspense>
  );
}
