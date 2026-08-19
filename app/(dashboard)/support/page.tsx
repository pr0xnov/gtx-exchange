"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

const FAQ: { qKey: DictionaryKey; aKey: DictionaryKey }[] = [
  { qKey: "support.faqRealExchangeQ", aKey: "support.faqRealExchangeA" },
  { qKey: "support.faqResetBalanceQ", aKey: "support.faqResetBalanceA" },
  { qKey: "support.faqPriceSourceQ", aKey: "support.faqPriceSourceA" },
  { qKey: "support.faqLeverageQ", aKey: "support.faqLeverageA" },
];

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const { t } = useLocale();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(t("support.toastMessageSent"));
    setMessage("");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">{t("support.title")}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("support.contactUs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t("support.subject")}</Label>
                <Input
                  className="mt-1.5"
                  placeholder={t("support.subjectPlaceholder")}
                  required
                />
              </div>
              <div>
                <Label>{t("support.message")}</Label>
                <textarea
                  className="mt-1.5 min-h-[120px] w-full rounded-xl border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={t("support.messagePlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">{t("support.sendMessage")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("support.getInTouch")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted">
              <MessageCircle className="h-4 w-4 text-primary" />
              {t("support.liveChat")}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              <Mail className="h-4 w-4 text-primary" />
              support@gtx.com
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              <Phone className="h-4 w-4 text-primary" />
              +1 (800) 555-0199
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("support.faq")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {FAQ.map((item) => (
            <details key={item.qKey} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                {t(item.qKey)}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(item.aKey)}</p>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
