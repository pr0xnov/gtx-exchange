"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { USDT_NETWORKS, type UsdtNetwork } from "@/lib/deposit/usdt-networks";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Address + QR for the currently selected network only — re-derives
 * both from `network` on every change (via the `address` dependency
 * below), so there is never a stale QR/address left over from a
 * previously selected network. The QR is generated locally with the
 * `qrcode` package already used by 2FA setup (see app/api/settings/2fa/
 * setup/route.ts) — no new dependency, no external QR API — and encodes
 * nothing but the raw address string itself.
 */
export function DepositAddressCard({ network }: { network: UsdtNetwork }) {
  const { t } = useLocale();
  const address = USDT_NETWORKS[network].address;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQrDataUrl(null);
    QRCode.toDataURL(address, { margin: 1, width: 96 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    toast.success(t("deposit.addressCopied"));
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {qrDataUrl && (
          // next/image can't optimize a data: URI, so this intentionally
          // renders it as a plain <img> — same pattern as the 2FA setup
          // QR (components/dashboard/settings/two-factor-settings.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={t("deposit.addressLabel")}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted">{t("deposit.addressLabel")}</div>
        <div className="font-tabular break-all text-sm text-foreground">{address}</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {t("deposit.copyButton")}
      </button>
    </div>
  );
}
