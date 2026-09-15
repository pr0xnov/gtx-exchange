"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { SUPPORT_CATEGORY_ADMIN_LABEL } from "@/lib/support/categories";
import {
  useAdminSupportConversations,
  useAdminSupportConversation,
  useAdminSendSupportMessage,
  useAdminSetSupportConversationStatus,
  type AdminSupportConversationRow,
} from "@/hooks/use-admin-api";

const STATUS_VARIANT: Record<string, "success" | "muted"> = {
  OPEN: "success",
  CLOSED: "muted",
};

function ConversationRow({
  row,
  active,
  onClick,
}: {
  row: AdminSupportConversationRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-foreground/[0.04]",
        active && "bg-primary/[0.06]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          {row.user.firstName} {row.user.lastName}
        </span>
        <Badge variant={STATUS_VARIANT[row.status] ?? "muted"} className="shrink-0">
          {row.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          {
            SUPPORT_CATEGORY_ADMIN_LABEL[
              row.category as keyof typeof SUPPORT_CATEGORY_ADMIN_LABEL
            ]
          }
        </span>
        <span>·</span>
        <span>{formatDate(row.updatedAt)}</span>
      </div>
      {row.lastMessage && (
        <p className="truncate text-xs text-muted">
          {row.lastMessage.senderType === "ADMIN" ? "You: " : ""}
          {row.lastMessage.message}
        </p>
      )}
    </button>
  );
}

export default function AdminSupportPage() {
  const [statusFilter, setStatusFilter] = useState<"OPEN" | undefined>("OPEN");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: conversations, isLoading } = useAdminSupportConversations(statusFilter);
  const { data: detail, isLoading: detailLoading } =
    useAdminSupportConversation(selectedId);
  const sendMessage = useAdminSendSupportMessage(selectedId);
  const setStatus = useAdminSetSupportConversationStatus();

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text || !selectedId) return;
    setReply("");
    try {
      await sendMessage.mutateAsync(text);
    } catch {
      toast.error("Message not sent. Please try again.");
      setReply(text);
    }
  }

  async function handleClose() {
    if (!selectedId) return;
    try {
      await setStatus.mutateAsync({ id: selectedId, status: "CLOSED" });
      toast.success("Conversation closed");
    } catch {
      toast.error("Couldn't close the conversation");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
        <p className="mt-1 text-sm text-muted">
          {conversations?.length ?? 0} {statusFilter === "OPEN" ? "open" : ""}{" "}
          conversation
          {conversations?.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={statusFilter === "OPEN" ? "primary" : "outline"}
          onClick={() => setStatusFilter("OPEN")}
        >
          Open
        </Button>
        <Button
          size="sm"
          variant={statusFilter === undefined ? "primary" : "outline"}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="h-[600px] overflow-y-auto rounded-2xl border border-border bg-card">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-border/50 p-4">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          {!isLoading && conversations?.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">No conversations yet.</p>
          )}
          {!isLoading &&
            conversations?.map((row) => (
              <ConversationRow
                key={row.id}
                row={row}
                active={row.id === selectedId}
                onClick={() => setSelectedId(row.id)}
              />
            ))}
        </div>

        <div className="flex h-[600px] flex-col rounded-2xl border border-border bg-card">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Select a conversation to view it
            </div>
          ) : detailLoading || !detail ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Loading…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {detail.user.firstName} {detail.user.lastName}
                  </p>
                  <p className="text-xs text-muted">{detail.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[detail.status] ?? "muted"}>
                    {detail.status}
                  </Badge>
                  {detail.status === "OPEN" && (
                    <Button size="sm" variant="outline" onClick={handleClose}>
                      Close conversation
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {detail.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      m.senderType === "ADMIN"
                        ? "ml-auto bg-primary/15 text-foreground"
                        : "bg-surface text-foreground"
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted">
                      <span>{m.senderType === "ADMIN" ? "You" : "User"}</span>
                      <span>{formatTime(m.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleReply}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply…"
                  className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!reply.trim() || sendMessage.isPending}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
