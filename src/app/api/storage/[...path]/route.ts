import { NextRequest, NextResponse } from "next/server";

/**
 * Authenticated storage proxy.
 * Prefer this over a bare rewrite so Authorization can be forwarded
 * from the browser request (or from the accessToken cookie).
 */
const apiBase =
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3000"
    : "https://strategize-api.frontiertech.org");

const EXT_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

function contentTypeForPath(objectKey: string, upstreamType?: string | null) {
  const normalized = (upstreamType || "").toLowerCase().split(";")[0].trim();
  if (
    normalized &&
    normalized !== "application/octet-stream" &&
    normalized !== "binary/octet-stream"
  ) {
    return normalized;
  }
  const ext = objectKey.split(".").pop()?.toLowerCase() || "";
  return EXT_CONTENT_TYPES[ext] || "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const objectKey = path.map(encodeURIComponent).join("/");
  const upstream = `${apiBase}/storage/${objectKey}`;

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("accessToken")?.value;
  const authorization =
    authHeader || (cookieToken ? `Bearer ${cookieToken}` : undefined);

  try {
    const response = await fetch(upstream, {
      headers: authorization ? { Authorization: authorization } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "File not found or unauthorized" },
        { status: response.status },
      );
    }

    const decodedKey = path.join("/");
    const contentType = contentTypeForPath(
      decodedKey,
      response.headers.get("content-type"),
    );
    const buffer = await response.arrayBuffer();
    const filename = path[path.length - 1] || "file";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Force inline preview (especially PDFs) instead of download.
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Storage proxy error:", error);
    return NextResponse.json(
      { message: "Could not reach file storage" },
      { status: 502 },
    );
  }
}
