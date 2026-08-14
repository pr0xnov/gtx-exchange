import { cn } from "@/lib/utils";
import {
  TokenADA,
  TokenAVAX,
  TokenBNB,
  TokenBTC,
  TokenDOGE,
  TokenETH,
  TokenLINK,
  TokenLTC,
  TokenSOL,
  TokenTRX,
  TokenUSDC,
  TokenUSDT,
  TokenXRP,
  type IconComponent,
} from "@web3icons/react";

// Checked package.json/node_modules and public/ first — no crypto-icon
// library or icon assets existed anywhere in this project. @web3icons/react
// (MIT, ~900 tokens, React components, no manual SVG drawing) is the one
// icon source now used for every symbol; only the tokens this app actually
// needs are imported by name, so the rest of the (large) package is
// tree-shaken out of the bundle.
const TOKEN_ICONS: Record<string, IconComponent> = {
  BTC: TokenBTC,
  ETH: TokenETH,
  USDT: TokenUSDT,
  BNB: TokenBNB,
  USDC: TokenUSDC,
  XRP: TokenXRP,
  SOL: TokenSOL,
  TRX: TokenTRX,
  DOGE: TokenDOGE,
  LTC: TokenLTC,
  ADA: TokenADA,
  AVAX: TokenAVAX,
  LINK: TokenLINK,
};

/**
 * Real per-coin logo, looked up by ticker (`symbol`) from the map above.
 * The "background" variant already renders a full-bleed colored square
 * with the token's own brand color and mark — wrapping it in a fixed
 * 24x24 `rounded-full overflow-hidden` circle (rather than trusting each
 * icon's own artwork to be circular) guarantees every coin renders as
 * the same size, round chip, Binance-style, regardless of symbol.
 *
 * Falls back to a neutral (never randomly colored) ticker-initial badge,
 * same size, for any symbol without a real icon in the map.
 */
export function CoinIcon({ symbol, className }: { symbol: string; className?: string }) {
  const Icon = TOKEN_ICONS[symbol.toUpperCase()];

  if (Icon) {
    return (
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full",
          className
        )}
      >
        <Icon variant="background" size={24} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-muted",
        className
      )}
      aria-hidden="true"
    >
      {symbol.slice(0, 1).toUpperCase()}
    </span>
  );
}
