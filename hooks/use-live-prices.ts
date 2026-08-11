"use client";

import { useEffect, useRef, useState } from "react";

export interface LiveTicker {
  symbol: string;
  price: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

/**
 * Subscribes to the GTX market data relay (server/ws), which itself
 * proxies Binance's live ticker stream. Falls back gracefully (keeps last
 * known prices) if the socket disconnects, and auto-reconnects.
 */
export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, LiveTicker>>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => !cancelled && setConnected(true);

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "snapshot") {
            const map: Record<string, LiveTicker> = {};
            for (const t of payload.data as LiveTicker[]) map[t.symbol] = t;
            setPrices((prev) => ({ ...prev, ...map }));
          } else if (payload.type === "ticker") {
            const t = payload.data as LiveTicker;
            setPrices((prev) => ({ ...prev, [t.symbol]: t }));
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      socket.onerror = () => socket.close();
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, []);

  return { prices, connected };
}
