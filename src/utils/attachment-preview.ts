/**
 * Helpers for previewing evidence / task attachments by URL or MIME type.
 */

export type AttachmentPreviewKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "office"
  | "link"
  | "email"
  | "unknown";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);
const VIDEO_EXT = new Set(["mp4", "webm", "ogg", "mov"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac"]);
const TEXT_EXT = new Set(["txt", "csv", "json", "md", "log"]);
const OFFICE_EXT = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

export function getUrlExtension(url: string): string {
  try {
    const path = url.split("?")[0].split("#")[0];
    const segment = path.split("/").pop() || "";
    const dot = segment.lastIndexOf(".");
    if (dot < 0) return "";
    return segment.slice(dot + 1).toLowerCase();
  } catch {
    return "";
  }
}

export function getAttachmentDisplayName(
  url: string,
  name?: string | null,
): string {
  if (name?.trim()) return name.trim();
  try {
    const path = url.split("?")[0].split("#")[0];
    const segment = decodeURIComponent(path.split("/").pop() || "");
    return segment || "Attachment";
  } catch {
    return "Attachment";
  }
}

/** Short label for dense tables — avoids raw UUID filenames. */
export function getAttachmentShortLabel(
  url: string,
  name?: string | null,
  mimeType?: string | null,
  evidenceType?: string | null,
): string {
  const kind = resolveAttachmentPreviewKind({ url, mimeType, evidenceType });
  if (kind === "email") return "Email note";
  if (kind === "link") return "Link";

  const display = getAttachmentDisplayName(url, name);
  const ext = getUrlExtension(url) || getUrlExtension(display);
  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
      display,
    );

  if (looksLikeUuid || !name) {
    if (kind === "image") return ext ? `Image (.${ext})` : "Image";
    if (kind === "pdf") return "PDF";
    if (kind === "office") return ext ? `Document (.${ext})` : "Document";
    if (ext) return `.${ext.toUpperCase()} file`;
    return kindLabel(kind);
  }

  if (display.length > 28) {
    const stem = display.slice(0, 18);
    return ext ? `${stem}….${ext}` : `${display.slice(0, 24)}…`;
  }
  return display;
}

export function resolveAttachmentPreviewKind(options: {
  url?: string | null;
  mimeType?: string | null;
  evidenceType?: string | null;
}): AttachmentPreviewKind {
  const evidenceType = options.evidenceType?.toUpperCase();
  if (evidenceType === "EMAIL") return "email";
  if (evidenceType === "LINK") return "link";
  if (evidenceType === "IMAGE") return "image";

  const mime = (options.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("text/") || mime === "application/json") return "text";
  if (
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("powerpoint") ||
    mime.includes("officedocument") ||
    mime.includes("msword") ||
    mime.includes("ms-excel") ||
    mime.includes("ms-powerpoint")
  ) {
    return "office";
  }

  const ext = getUrlExtension(options.url || "");
  if (IMAGE_EXT.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (TEXT_EXT.has(ext)) return "text";
  if (OFFICE_EXT.has(ext)) return "office";

  if (options.url && /^https?:\/\//i.test(options.url) && !ext) {
    return "link";
  }

  return "unknown";
}

/**
 * Normalize stored upload paths so the browser hits the Next.js proxy
 * (`/api/storage/...`) instead of the API origin directly.
 */
export function toProxiedStorageUrl(url: string): string {
  if (!url) return url;

  // Already same-origin proxied
  if (url.startsWith("/api/storage/")) return url;

  // API-relative storage path from upload response
  if (url.startsWith("/storage/")) {
    return `/api${url}`;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    const path = parsed.pathname;
    if (path.startsWith("/storage/")) {
      return `/api${path}${parsed.search}`;
    }
    // Absolute MinIO / GCS public URLs stay as-is
    if (/^https?:\/\//i.test(url)) return url;
  } catch {
    // fall through
  }

  return url;
}

export function isAppStorageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/storage/") || url.startsWith("/api/storage/")) {
    return true;
  }
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.pathname.startsWith("/storage/");
  } catch {
    return false;
  }
}

export function kindLabel(kind: AttachmentPreviewKind): string {
  switch (kind) {
    case "image":
      return "Image";
    case "pdf":
      return "PDF";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "text":
      return "Text";
    case "office":
      return "Document";
    case "link":
      return "Link";
    case "email":
      return "Email";
    default:
      return "File";
  }
}
