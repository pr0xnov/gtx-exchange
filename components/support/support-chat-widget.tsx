"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";
import type { SupportCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn, formatTime } from "@/lib/utils";
import {
  useMySupportConversations,
  useCreateSupportConversation,
  useSupportMessages,
  useSendSupportMessage,
} from "@/hooks/use-support-api";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_CATEGORY_LABEL_KEYS,
} from "@/lib/support/categories";

interface SupportChatWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
}

/**
 * The /contacts support chat — a compact bottom-right drawer on desktop,
 * a near-full-screen panel on mobile (see the responsive classes below).
 * Guests are asked to log in rather than allowed to chat anonymously —
 * the simplest option consistent with this app's existing auth
 * architecture, where every other user action (deposit, withdraw,
 * trading) already requires a real account. Authenticated users never
 * re-enter their name/email — identity comes entirely from the session
 * cookie server-side (see app/api/support/conversations/route.ts).
 */
export function SupportChatWidget({
  open,
  onOpenChange,
  isAuthenticated,
}: SupportChatWidgetProps) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } =
    useMySupportConversations(open && isAuthenticated);
  const activeConversation =
    conversations?.find((c) => c.id === selectedId) ??
    conversations?.find((c) => c.status === "OPEN") ??
    null;
  const conversationId = activeConversation?.id ?? null;

  const createConversation = useCreateSupportConversation();
  const { data: thread, isLoading: messagesLoading } = useSupportMessages(
    conversationId,
    open && isAuthenticated
  );
  const sendMessage = useSendSupportMessage(conversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  async function handleSelectCategory(category: SupportCategory) {
    try {
      const conversation = await createConversation.mutateAsync(category);
      setSelectedId(conversation.id);
    } catch {
      toast.error(t("supportChat.errors.createFailed"));
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId) return;
    setDraft("");
    try {
      await sendMessage.mutateAsync(text);
    } catch {
      toast.error(t("supportChat.errors.sendFailed"));
      setDraft(text);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={t("supportChat.fab.ariaLabel")}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95",
          open && "hidden sm:flex"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className={cn(
            "fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card",
            "sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[560px] sm:w-96"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              {t("supportChat.header.title")}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t("common.close")}
              className="rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <MessageCircle className="h-8 w-8 text-muted" />
              <p className="text-sm font-medium text-foreground">
                {t("supportChat.guest.title")}
              </p>
              <p className="text-xs text-muted">{t("supportChat.guest.body")}</p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/login?redirect=/contacts">{t("common.login")}</Link>
              </Button>
            </div>
          ) : conversationsLoading ? (
            <div className="flex flex-1 items-center justify-center text-xs text-muted">
              {t("common.loading")}
            </div>
          ) : !conversationId ? (
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              <p className="mb-1 text-xs font-medium text-muted">
                {t("supportChat.category.prompt")}
              </p>
              {SUPPORT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  disabled={createConversation.isPending}
                  onClick={() => handleSelectCategory(category)}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                >
                  {t(SUPPORT_CATEGORY_LABEL_KEYS[category])}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread?.status === "CLOSED" && (
                  <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                    {t("supportChat.messages.closedBanner")}
                  </div>
                )}
                {!messagesLoading && thread?.messages.length === 0 && (
                  <p className="text-center text-xs text-muted">
                    {t("supportChat.messages.empty")}
                  </p>
                )}
                {thread?.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                      m.senderType === "USER"
                        ? "ml-auto bg-primary/15 text-foreground"
                        : "bg-surface text-foreground"
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted">
                      <span>
                        {m.senderType === "USER"
                          ? t("supportChat.messages.you")
                          : t("supportChat.messages.team")}
                      </span>
                      <span>{formatTime(m.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("supportChat.input.placeholder")}
                  className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || sendMessage.isPending}
                  aria-label={t("supportChat.input.send")}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
