"use client";

import { useState } from "react";
import { FileCheck2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileUploadRow } from "@/components/dashboard/file-upload-row";
import { useLocale } from "@/lib/i18n/locale-context";
import type { UsdtNetwork } from "@/lib/deposit/usdt-networks";

/**
 * "Подтверждение перевода" — the final step of the Deposit flow. Only
 * reached once network+amount are already validated (see
 * deposit-form.tsx); this modal's own job is exactly one thing: get a
 * required payment-confirmation screenshot, then submit the ONE
 * multipart request that actually creates the PENDING Transaction (see
 * app/api/deposit/route.ts — no deposit exists before this succeeds).
 *
 * Raw fetch(), not a useMutation()/fetchJson() hook — same reasoning
 * as POST /api/verification's own client call in verification-form.tsx:
 * fetchJson forces a JSON Content-Type header, which breaks a
 * multipart FormData body's own boundary.
 */
export function DepositProofModal({
  network,
  amount,
  onClose,
  onSuccess,
}: {
  network: UsdtNetwork;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!file) {
      setError(t("deposit.proofRequiredError"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("amount", String(amount));
      form.set("method", "TETHER_USDT");
      form.set("network", network);
      form.set("proof", file);

      const res = await fetch("/api/deposit", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Request failed");
      }

      toast.success(t("deposit.pendingSubmittedTitle"), {
        description: t("deposit.pendingSubmittedDescription"),
      });
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deposit.failedFallback"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="relative flex items-center justify-center">
          <h2 className="text-lg font-semibold text-foreground">
            {t("deposit.proofModalTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span>{t("deposit.proofModalText")}</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span>{t("deposit.proofModalHint")}</span>
          </li>
        </ul>

        <div className="mt-4">
          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t("deposit.proofFileLabel")}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  {t("deposit.proofUploadedLabel")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label={t("deposit.proofRemoveAria")}
                className="rounded-md p-1 text-danger hover:bg-danger/10 hover:text-danger-hover"
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <FileUploadRow
              label={t("deposit.proofFileLabel")}
              accept="image/png,image/jpeg,image/webp"
              buttonLabel={t("deposit.proofUploadButton")}
              onFileSelected={(f) => {
                setFile(f);
                setError(null);
              }}
            />
          )}
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("deposit.proofSubmitButton")
          )}
        </Button>
      </div>
    </div>
  );
}
