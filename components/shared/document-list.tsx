"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DocumentViewerModal } from "@/components/shared/document-viewer-modal";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export interface DocumentListRow {
  id: string;
  type: string;
  fileName: string;
  mimeType: string | null;
  uploadedAt: string;
}

/** Shared by both the user's own /verification page and the Admin Panel's
 *  review screen — the one place that actually opens a document, via the
 *  protected GET /api/verification/documents/[id]/file (owner-or-admin
 *  only, checked server-side). Images preview in a lightbox; PDFs open in
 *  a new tab using the browser's native viewer.
 *
 *  `onDelete` is optional and, when provided, adds a Delete button with a
 *  confirm step — only the admin review page passes it (SUPER_ADMIN-only
 *  server-side, via DELETE on the same file route); the user's own
 *  /verification page never does, so a user never sees a Delete control
 *  on their own documents. */
export function DocumentList({
  documents,
  typeLabel,
  onDelete,
}: {
  documents: DocumentListRow[];
  typeLabel: (type: string) => string;
  onDelete?: (documentId: string) => Promise<void>;
}) {
  const { t } = useLocale();
  const [preview, setPreview] = useState<DocumentListRow | null>(null);
  const [confirming, setConfirming] = useState<DocumentListRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  function open(doc: DocumentListRow) {
    const url = `/api/verification/documents/${doc.id}/file`;
    if (doc.mimeType?.startsWith("image/")) {
      setPreview(doc);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function handleConfirmDelete() {
    if (!confirming || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(confirming.id);
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  }

  if (documents.length === 0) {
    return <p className="text-sm text-muted">{t("verification.documentList.empty")}</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 shrink-0 text-muted" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {typeLabel(d.type)}
                </div>
                <div className="text-xs text-muted">
                  {d.fileName} · {formatDate(d.uploadedAt)}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => open(d)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("verification.documentList.open")}
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setConfirming(d)}
                  className="text-sm font-medium text-danger hover:underline"
                >
                  {t("verification.documentList.delete")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <DocumentViewerModal
          url={`/api/verification/documents/${preview.id}/file`}
          fileName={preview.fileName}
          mimeType={preview.mimeType}
          onClose={() => setPreview(null)}
        />
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !deleting && setConfirming(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-danger">
              <Trash2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                {t("verification.documentList.deleteTitle")}
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              {t("verification.documentList.deleteConfirm")}
            </p>
            <p className="mt-1 text-xs text-muted">
              {typeLabel(confirming.type)} · {confirming.fileName}
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirming(null)}
                disabled={deleting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? t("verification.documentList.deleting")
                  : t("verification.documentList.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
