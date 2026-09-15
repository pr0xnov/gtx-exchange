"use client";

import { useState } from "react";
import { MessageCircle, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import { SUPPORT_TELEGRAM_URL, SUPPORT_EMAIL } from "@/lib/support/config";
import { SupportChatWidget } from "@/components/support/support-chat-widget";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

const FAQ_ITEMS: { qKey: DictionaryKey; aKey: DictionaryKey }[] = [
  {
    qKey: "marketing.contacts.faq.deposits.q",
    aKey: "marketing.contacts.faq.deposits.a",
  },
  {
    qKey: "marketing.contacts.faq.verification.q",
    aKey: "marketing.contacts.faq.verification.a",
  },
  {
    qKey: "marketing.contacts.faq.trading.q",
    aKey: "marketing.contacts.faq.trading.a",
  },
  {
    qKey: "marketing.contacts.faq.bonuses.q",
    aKey: "marketing.contacts.faq.bonuses.a",
  },
  {
    qKey: "marketing.contacts.faq.security.q",
    aKey: "marketing.contacts.faq.security.a",
  },
];

export function ContactsSupportSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { t } = useLocale();
  const [chatOpen, setChatOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<DictionaryKey | null>(null);

  return (
    <>
      <section className="container grid gap-6 py-16 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("marketing.contacts.cards.chat.title")}
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            {t("marketing.contacts.cards.chat.description")}
          </p>
          <Button className="mt-5" onClick={() => setChatOpen(true)}>
            {t("marketing.contacts.cards.chat.button")}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Send className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("marketing.contacts.cards.telegram.title")}
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            {t("marketing.contacts.cards.telegram.description")}
          </p>
          {SUPPORT_TELEGRAM_URL ? (
            <Button asChild className="mt-5">
              <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                {t("marketing.contacts.cards.telegram.button")}
              </a>
            </Button>
          ) : (
            <Button
              className="mt-5"
              disabled
              title={t("marketing.contacts.cards.telegram.unavailable")}
            >
              {t("marketing.contacts.cards.telegram.button")}
            </Button>
          )}
        </div>
      </section>

      <section className="container pb-20">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {t("marketing.contacts.faq.title")}
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaq === item.qKey;
            return (
              <div key={item.qKey}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : item.qKey)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground">
                    {t(item.qKey)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted">
                    {t(item.aKey)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {SUPPORT_EMAIL && (
          <p className="mt-6 text-center text-sm text-muted">
            {t("marketing.contacts.email.note")}{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        )}
      </section>

      <SupportChatWidget
        open={chatOpen}
        onOpenChange={setChatOpen}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
