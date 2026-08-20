import { cn } from "@/lib/utils";
import { baseAssetOf } from "@/lib/markets/derive";
import {
  TokenAAVE,
  TokenADA,
  TokenALGO,
  TokenAPT,
  TokenARB,
  TokenATOM,
  TokenAVAX,
  TokenAXS,
  TokenBAT,
  TokenBCH,
  TokenBNB,
  TokenBTC,
  TokenCELO,
  TokenCHZ,
  TokenCOMP,
  TokenCRV,
  TokenDASH,
  TokenDEXE,
  TokenDODO,
  TokenDOGE,
  TokenDOT,
  TokenEGLD,
  TokenENJ,
  TokenETC,
  TokenETH,
  TokenFET,
  TokenFIL,
  TokenFLOW,
  TokenGALA,
  TokenGRT,
  TokenHBAR,
  TokenICP,
  TokenIMX,
  TokenINJ,
  TokenIOTA,
  TokenJST,
  TokenJUP,
  TokenKAVA,
  TokenKNC,
  TokenKSM,
  TokenLDO,
  TokenLINK,
  TokenLTC,
  TokenMANA,
  TokenMKR,
  TokenMOVR,
  TokenNEAR,
  TokenNEO,
  TokenONE,
  TokenOP,
  TokenPENDLE,
  TokenPEPE,
  TokenPIXEL,
  TokenPOL,
  TokenPORTAL,
  TokenPYTH,
  TokenQNT,
  TokenRNDR,
  TokenROSE,
  TokenRUNE,
  TokenSAND,
  TokenSCRT,
  TokenSEI,
  TokenSHIB,
  TokenSNX,
  TokenSOL,
  TokenSTORJ,
  TokenSTRK,
  TokenSTX,
  TokenSUI,
  TokenTHETA,
  TokenTIA,
  TokenTON,
  TokenTRX,
  TokenUNI,
  TokenUSDC,
  TokenUSDT,
  TokenVET,
  TokenWBTC,
  TokenXLM,
  TokenXRP,
  TokenXTZ,
  TokenYFI,
  TokenZEC,
  TokenZIL,
  TokenZRX,
  type IconComponent,
} from "@web3icons/react";

/**
 * Real per-coin logos from @web3icons/react (MIT, ~900 tokens, React
 * components — no manual SVG drawing, no remote-per-icon URLs, no other
 * icon library alongside it). Checked package.json/node_modules first;
 * this was already the project's one icon dependency from an earlier
 * Markets task, so it's reused rather than adding a second source.
 *
 * Only the tickers actually present in this map are statically imported
 * by name above — normal ES-module tree-shaking keeps the rest of the
 * (large) package out of the client bundle; there is no per-icon network
 * request or CDN dependency either way.
 *
 * Covers every symbol currently in MARKET_REGISTRY (lib/binance/client.ts)
 * that this icon set has real artwork for, plus a couple of tickers
 * (TON, MKR) this task's own checklist named that aren't tracked yet —
 * harmless to map ahead of time. `RENDER` is mapped to the `RNDR` export
 * since that's the ticker this rebranded project shipped under in this
 * icon set's data. Tickers with no real icon here (a handful of newer/
 * smaller-cap listings — WLD, ACE, BICO, ENA, ONDO, BONK, NOT, PNUT,
 * VANRY, ALT, MANTA, ANKR, FLOKI, S) fall through to the neutral
 * ticker-initial badge below — never a random color, never invented art.
 */
const TOKEN_ICONS: Record<string, IconComponent> = {
  AAVE: TokenAAVE,
  ADA: TokenADA,
  ALGO: TokenALGO,
  APT: TokenAPT,
  ARB: TokenARB,
  ATOM: TokenATOM,
  AVAX: TokenAVAX,
  AXS: TokenAXS,
  BAT: TokenBAT,
  BCH: TokenBCH,
  BNB: TokenBNB,
  BTC: TokenBTC,
  CELO: TokenCELO,
  CHZ: TokenCHZ,
  COMP: TokenCOMP,
  CRV: TokenCRV,
  DASH: TokenDASH,
  DEXE: TokenDEXE,
  DODO: TokenDODO,
  DOGE: TokenDOGE,
  DOT: TokenDOT,
  EGLD: TokenEGLD,
  ENJ: TokenENJ,
  ETC: TokenETC,
  ETH: TokenETH,
  FET: TokenFET,
  FIL: TokenFIL,
  FLOW: TokenFLOW,
  GALA: TokenGALA,
  GRT: TokenGRT,
  HBAR: TokenHBAR,
  ICP: TokenICP,
  IMX: TokenIMX,
  INJ: TokenINJ,
  IOTA: TokenIOTA,
  JST: TokenJST,
  JUP: TokenJUP,
  KAVA: TokenKAVA,
  KNC: TokenKNC,
  KSM: TokenKSM,
  LDO: TokenLDO,
  LINK: TokenLINK,
  LTC: TokenLTC,
  MANA: TokenMANA,
  MKR: TokenMKR,
  MOVR: TokenMOVR,
  NEAR: TokenNEAR,
  NEO: TokenNEO,
  ONE: TokenONE,
  OP: TokenOP,
  PENDLE: TokenPENDLE,
  PEPE: TokenPEPE,
  PIXEL: TokenPIXEL,
  POL: TokenPOL,
  PORTAL: TokenPORTAL,
  PYTH: TokenPYTH,
  QNT: TokenQNT,
  RENDER: TokenRNDR,
  ROSE: TokenROSE,
  RUNE: TokenRUNE,
  SAND: TokenSAND,
  SCRT: TokenSCRT,
  SEI: TokenSEI,
  SHIB: TokenSHIB,
  SNX: TokenSNX,
  SOL: TokenSOL,
  STORJ: TokenSTORJ,
  STRK: TokenSTRK,
  STX: TokenSTX,
  SUI: TokenSUI,
  THETA: TokenTHETA,
  TIA: TokenTIA,
  TON: TokenTON,
  TRX: TokenTRX,
  UNI: TokenUNI,
  USDC: TokenUSDC,
  USDT: TokenUSDT,
  VET: TokenVET,
  WBTC: TokenWBTC,
  XLM: TokenXLM,
  XRP: TokenXRP,
  XTZ: TokenXTZ,
  YFI: TokenYFI,
  ZEC: TokenZEC,
  ZIL: TokenZIL,
  ZRX: TokenZRX,
};

/** Normalizes any symbol form this app passes around into a plain base
 *  ticker: "BTCUSDT" -> "BTC", "btc" -> "BTC", "BTC" -> "BTC". Reuses the
 *  same USDT-suffix rule already used to derive `base` in
 *  lib/markets/derive.ts, so there's exactly one definition of what
 *  "the base ticker" means, not a second one here. */
function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  // baseAssetOf strips a trailing "USDT" — correct for a pair like
  // "BTCUSDT" -> "BTC", but "USDT" itself IS the ticker (Tether is a
  // real coin with its own icon), not a pair with an empty base. Only
  // use the stripped form when something is actually left over.
  return baseAssetOf(upper) || upper;
}

/**
 * Single reusable coin icon for every Markets table (Все криптовалюты,
 * Избранные, Популярные, Показывают рост, Теряют в цене, Максимальный
 * объём, Наибольшее движение — all render through MiniMarketTable, which
 * is the only caller of this component). Accepts either a bare ticker
 * (`symbol="BTC"`) or a full trading pair (`symbol="BTCUSDT"`); both
 * resolve to the same icon.
 *
 * The "background" variant already renders a full-bleed colored square
 * with the token's own brand color and mark — wrapping it in a fixed
 * 24x24 `rounded-full overflow-hidden` circle (rather than trusting each
 * icon's own artwork to be circular) guarantees every coin renders as
 * the same size, round chip, Binance-style, regardless of symbol.
 *
 * Falls back to a neutral (never randomly colored) ticker-initial badge,
 * same size, only for symbols with no real icon in the map above.
 */
export function CoinIcon({ symbol, className }: { symbol: string; className?: string }) {
  const ticker = normalizeSymbol(symbol);
  const Icon = TOKEN_ICONS[ticker];

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
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold text-muted",
        className
      )}
      aria-hidden="true"
    >
      {ticker.slice(0, 1)}
    </span>
  );
}
