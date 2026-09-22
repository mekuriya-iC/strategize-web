import { getAccessToken } from "@/lib/auth-utils";

// File upload utility for profile pictures and evidence attachments
export type UploadCategory =
  | "Logbook"
  | "TaskEvidence"
  | "Profile"
  | "General";

export interface UploadOptions {
  /** MinIO folder by attachment type */
  category?: UploadCategory;
  /** Division folder under the category */
  divisionId?: string | null;
  /** Employee folder under the division */
  employeeId?: string | null;
}

export interface UploadResponse {
  url: string;
  filename: string;
  originalname: string;
  size: number;
  type: string;
  category?: string;
  divisionId?: string;
  employeeId?: string;
}

/** Matches strategize-api `/upload` evidence fileFilter */
export const EVIDENCE_ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp";

export const EVIDENCE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const EVIDENCE_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export const validateEvidenceFile = (
  file: File,
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB — matches API limits
  const extension = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";
  const mimeOk =
    !file.type ||
    EVIDENCE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof EVIDENCE_ALLOWED_MIME_TYPES)[number],
    );
  const extensionOk = EVIDENCE_EXTENSIONS.has(extension);

  if (!mimeOk && !extensionOk) {
    return {
      valid: false,
      error:
        "Only PDF, DOC, DOCX, JPEG, PNG, and WebP evidence files are allowed",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  return { valid: true };
};

async function readUploadErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // fall through
  }
  return `Upload failed: ${response.statusText || response.status}`;
}

export const uploadFile = async (
  file: File,
  options: UploadOptions = {},
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  if (options.category) {
    formData.append("category", options.category);
  }
  if (options.divisionId) {
    formData.append("divisionId", options.divisionId);
  }
  if (options.employeeId) {
    formData.append("employeeId", options.employeeId);
  }

  const token = getAccessToken();
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readUploadErrorMessage(response));
  }

  return response.json();
};

// Validate image file
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a valid image file (JPEG, PNG, JPG, or WebP)",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  return { valid: true };
};
