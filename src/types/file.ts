/**
 * File Attachment Types
 */

export interface FileAttachment {
  fileAttachmentId: string;
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  storageUrl: string;
  storageKey: string;
  isPublic: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  uploadedBy: {
    employeeId: string;
    fullName: string;
    email?: string;
    picture?: string;
  };
  createdAt: string;
}

// Input types for mutations
export interface CreateFileAttachmentInput {
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  storageUrl: string;
  storageKey: string;
  isPublic?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  organizationId: string;
}

export interface UpdateFileAttachmentInput {
  fileAttachmentId: string;
  fileName?: string;
  isPublic?: boolean;
}

// File upload utilities
export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
];

export const FILE_TYPE_ICONS: Record<string, string> = {
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  'text/plain': '📄',
  'text/csv': '📊',
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
};

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileIcon(fileType?: string): string {
  if (!fileType) return '📄';
  return FILE_TYPE_ICONS[fileType] || '📄';
}

export function isImageFile(fileType?: string): boolean {
  if (!fileType) return false;
  return fileType.startsWith('image/');
}

export function isPdfFile(fileType?: string): boolean {
  return fileType === 'application/pdf';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }

  return { valid: true };
}
