"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/locale-context";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * The one place that copies the user's real, permanent referral code to
 * the clipboard — used both by the premium referral bonus card's CTA (see
 * components/marketing/bonuses/referral-card.tsx) and by the personal
 * referral section's own code row (see referral-code-card.tsx), so there
 * is exactly one copy-to-clipboard implementation, not two independently
 * maintained ones. `referralCode` is always passed in from a Server
 * Component that already resolved it from User.referralCode — this
 * component never fetches or regenerates one itself.
 */
export function CopyReferralCodeButton({
  referralCode,
  ...buttonProps
}: { referralCode: string } & Omit<ButtonProps, "onClick" | "type" | "children">) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success(t("marketing.bonuses.personal.copiedFeedback"));
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" onClick={handleCopy} {...buttonProps}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {t("marketing.bonuses.personal.copyButton")}
    </Button>
  );
}
