"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface DocumentViewerModalProps {
  url: string;
  fileName: string;
  mimeType: string | null;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

/** Image preview lightbox for a verification document, with basic
 *  click-to-zoom controls so an admin can actually inspect detail (a
 *  photographed ID at "fit the modal" size is often too small to read).
 *  PDFs are never routed through this modal — they open in a new tab via
 *  the browser's own PDF viewer instead (see the callers), which handles
 *  pagination/zoom far better than an <iframe> here would. */
export function DocumentViewerModal({
  url,
  fileName,
  mimeType,
  onClose,
}: DocumentViewerModalProps) {
  const { t } = useLocale();
  const isImage = mimeType?.startsWith("image/") ?? false;
  const [zoom, setZoom] = useState(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-10 right-0 flex items-center gap-1">
          {isImage && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
                disabled={zoom <= MIN_ZOOM}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
                title={t("verification.documentViewer.zoomOut")}
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
                disabled={zoom >= MAX_ZOOM}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
                title={t("verification.documentViewer.zoomIn")}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                  title={t("verification.documentViewer.resetZoom")}
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            title={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {isImage ? (
          <div className="max-h-[85vh] max-w-full overflow-auto rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              className="max-h-[85vh] max-w-full object-contain transition-transform"
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted">
            {fileName} {t("verification.documentViewer.cannotPreview")}{" "}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t("verification.documentViewer.openInNewTab")}
            </a>
            .
          </div>
        )}
        <p className="text-xs text-white/70">{fileName}</p>
      </div>
    </div>
  );
}
