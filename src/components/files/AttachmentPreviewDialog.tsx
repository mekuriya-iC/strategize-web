"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getAccessToken } from "@/lib/auth-utils";
import {
  getAttachmentDisplayName,
  getUrlExtension,
  isAppStorageUrl,
  kindLabel,
  resolveAttachmentPreviewKind,
  toProxiedStorageUrl,
  type AttachmentPreviewKind,
} from "@/utils/attachment-preview";

export interface AttachmentPreviewItem {
  url: string;
  name?: string | null;
  mimeType?: string | null;
  evidenceType?: string | null;
}

interface AttachmentPreviewDialogProps {
  item: AttachmentPreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function mimeForPreviewKind(
  kind: AttachmentPreviewKind,
  url: string,
  mimeType?: string | null,
): string | undefined {
  const provided = mimeType?.toLowerCase().split(";")[0].trim();
  if (provided && provided !== "application/octet-stream") return provided;

  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "image": {
      const ext = getUrlExtension(url);
      if (ext === "png") return "image/png";
      if (ext === "webp") return "image/webp";
      if (ext === "gif") return "image/gif";
      return "image/jpeg";
    }
    case "video":
      return "video/mp4";
    case "audio":
      return "audio/mpeg";
    case "text":
      return "text/plain";
    default:
      return undefined;
  }
}

export default function AttachmentPreviewDialog({
  item,
  open,
  onOpenChange,
}: AttachmentPreviewDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const kind: AttachmentPreviewKind = item
    ? resolveAttachmentPreviewKind({
        url: item.url,
        mimeType: item.mimeType,
        evidenceType: item.evidenceType,
      })
    : "unknown";
  const title = item
    ? getAttachmentDisplayName(item.url, item.name)
    : "Attachment";
  const fetchUrl = item ? toProxiedStorageUrl(item.url) : "";
  const needsAuthFetch = item ? isAppStorageUrl(item.url) : false;
  const canInlinePreview =
    kind === "image" ||
    kind === "pdf" ||
    kind === "video" ||
    kind === "audio" ||
    kind === "text";

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    const load = async () => {
      setObjectUrl(null);
      setTextContent(null);
      setError(null);

      if (!open || !item?.url) return;

      // Email / plain text evidence (not a file URL)
      if (kind === "email") {
        setTextContent(item.url);
        return;
      }

      // External links without a downloadable file — show in iframe if possible
      if (kind === "link" && !needsAuthFetch) {
        setObjectUrl(item.url);
        return;
      }

      if (!canInlinePreview && !needsAuthFetch) {
        return;
      }

      setLoading(true);
      try {
        const headers: HeadersInit = {};
        if (needsAuthFetch) {
          const token = getAccessToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "You need to be signed in to preview this file."
              : `Could not load file (${response.status}).`,
          );
        }

        const rawBlob = await response.blob();
        if (cancelled) return;

        if (kind === "text") {
          const text = await rawBlob.text();
          if (!cancelled) setTextContent(text);
          return;
        }

        // MinIO / Nest often streams files as octet-stream. Re-wrap with the
        // correct MIME so the browser renders PDFs/images instead of downloading.
        const mime = mimeForPreviewKind(
          kind,
          item.url,
          item.mimeType || rawBlob.type,
        );
        const typedBlob =
          mime && rawBlob.type !== mime
            ? new Blob([rawBlob], { type: mime })
            : rawBlob;

        createdUrl = URL.createObjectURL(typedBlob);
        if (!cancelled) setObjectUrl(createdUrl);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load attachment.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [
    open,
    item?.url,
    item?.name,
    item?.mimeType,
    item?.evidenceType,
    kind,
    fetchUrl,
    needsAuthFetch,
    canInlinePreview,
  ]);

  const handleOpenExternal = () => {
    if (!item?.url) return;
    // Prefer the in-memory blob (correct MIME) so a new tab also previews.
    window.open(
      objectUrl || fetchUrl || item.url,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleDownload = () => {
    if (!item?.url) return;
    const anchor = document.createElement("a");
    anchor.href = objectUrl || fetchUrl || item.url;
    anchor.download =
      title.endsWith(".pdf") || title.includes(".")
        ? title
        : `${title}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-xl">{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {kindLabel(kind)}
                {item?.mimeType ? ` · ${item.mimeType}` : ""}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(kind === "link" ||
                kind === "unknown" ||
                kind === "office" ||
                kind === "pdf") && (
                <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
              )}
              {kind !== "email" && kind !== "link" && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-[320px] flex-1 items-center justify-center overflow-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              Loading preview…
            </div>
          )}

          {!loading && error && (
            <div className="flex max-w-md flex-col items-center gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={handleOpenExternal}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </Button>
            </div>
          )}

          {!loading && !error && kind === "email" && textContent && (
            <pre className="w-full whitespace-pre-wrap rounded-md bg-white p-4 text-sm dark:bg-gray-950">
              {textContent}
            </pre>
          )}

          {!loading && !error && kind === "text" && textContent != null && (
            <pre className="max-h-[60vh] w-full overflow-auto whitespace-pre-wrap rounded-md bg-white p-4 text-left text-sm dark:bg-gray-950">
              {textContent}
            </pre>
          )}

          {!loading && !error && kind === "image" && objectUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={title}
              className="max-h-[65vh] max-w-full rounded-lg object-contain"
            />
          )}

          {!loading && !error && kind === "pdf" && objectUrl && (
            <object
              data={`${objectUrl}#toolbar=1&navpanes=0`}
              type="application/pdf"
              title={title}
              className="h-[70vh] w-full rounded-lg bg-white"
            >
              <iframe
                src={`${objectUrl}#toolbar=1&navpanes=0`}
                title={title}
                className="h-[70vh] w-full rounded-lg bg-white"
              />
            </object>
          )}

          {!loading && !error && kind === "video" && objectUrl && (
            <video
              src={objectUrl}
              controls
              className="max-h-[65vh] max-w-full rounded-lg"
            >
              Your browser does not support video playback.
            </video>
          )}

          {!loading && !error && kind === "audio" && objectUrl && (
            <audio src={objectUrl} controls className="w-full max-w-md">
              Your browser does not support audio playback.
            </audio>
          )}

          {!loading &&
            !error &&
            kind === "link" &&
            objectUrl &&
            !needsAuthFetch && (
              <iframe
                src={objectUrl}
                title={title}
                className="h-[65vh] w-full rounded-lg bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            )}

          {!loading && !error && (kind === "office" || kind === "unknown") && (
            <div className="flex max-w-md flex-col items-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                <FileText className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold">Preview not available</h3>
              <p className="text-sm text-muted-foreground">
                This file type cannot be previewed in the browser. Download or
                open it instead.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleOpenExternal}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
