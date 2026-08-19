"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function ContactForm() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(t("marketing.contactForm.successToast"));
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("marketing.contactForm.nameLabel")}</Label>
          <Input
            className="mt-1.5"
            placeholder={t("marketing.contactForm.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>{t("marketing.contactForm.emailLabel")}</Label>
          <Input
            className="mt-1.5"
            type="email"
            placeholder={t("marketing.contactForm.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <Label>{t("marketing.contactForm.messageLabel")}</Label>
        <textarea
          className="mt-1.5 min-h-[140px] w-full rounded-xl border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={t("marketing.contactForm.messagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <Button type="submit">{t("marketing.contactForm.submitButton")}</Button>
    </form>
  );
}
