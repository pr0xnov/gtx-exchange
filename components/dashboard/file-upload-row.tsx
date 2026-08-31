"use client";

import { useRef, useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function FileUploadRow({
  label,
  onFileSelected,
  accept = "image/*,.pdf",
  buttonLabel,
}: {
  label: string;
  onFileSelected: (file: File) => void;
  /** Defaults to Verification's own image-or-PDF allowance. Deposit's
   *  proof upload passes a narrower, images-only value. */
  accept?: string;
  /** Defaults to Verification's own button text so its two existing
   *  call sites (identity/proof-of-address) are unaffected. */
  buttonLabel?: string;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFileSelected(file);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {fileName && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
            <FileCheck2 className="h-3.5 w-3.5" />
            {fileName}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {buttonLabel ?? t("verification.chooseFile")}
      </Button>
    </div>
  );
}
