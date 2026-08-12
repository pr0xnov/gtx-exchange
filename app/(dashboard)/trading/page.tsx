import { Suspense } from "react";
import { TradingTerminal } from "@/components/trading/trading-terminal";

function TerminalFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background text-sm text-muted">
      Loading trading terminal…
    </div>
  );
}

export default function TradingPage() {
  return (
    <Suspense fallback={<TerminalFallback />}>
      <TradingTerminal />
    </Suspense>
  );
}
