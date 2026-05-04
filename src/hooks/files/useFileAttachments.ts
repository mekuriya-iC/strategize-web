import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_FILE_ATTACHMENTS,
  GET_FILE_ATTACHMENT,
} from '@/lib/graphql/queries/files';
import {
  CREATE_FILE_ATTACHMENT,
  UPDATE_FILE_ATTACHMENT,
  REMOVE_FILE_ATTACHMENT,
} from '@/lib/graphql/mutations/files';

// ===================== TYPES =====================

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
    picture?: string;
  };
  createdAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemCount: number;
}

// ===================== QUERY HOOKS =====================

export const useFileAttachments = (variables: {
  page?: number;
  limit?: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
} = {}) => {
  const { page = 1, limit = 50, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_FILE_ATTACHMENTS, {
    variables: { page, limit, ...rest },
    skip: !rest.relatedEntityId && !rest.relatedEntityType,
    fetchPolicy: 'cache-and-network',
  });

  return {
    files: (data?.fileAttachments?.items || []) as FileAttachment[],
    meta: data?.fileAttachments?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useFileAttachment = (fileAttachmentId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_FILE_ATTACHMENT, {
    variables: { fileAttachmentId },
    skip: !fileAttachmentId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    file: data?.fileAttachment as FileAttachment | undefined,
    loading,
    error,
    refetch,
  };
};

// ===================== MUTATION HOOKS =====================

export const useFileAttachmentMutations = () => {
  const [createFileAttachmentMutation, { loading: createLoading }] = useMutation(
    CREATE_FILE_ATTACHMENT,
    {
      onCompleted: (data) => {
        toast.success('File uploaded successfully!', {
          description: `"${data.createFileAttachment.fileName}" has been uploaded.`,
        });
      },
      onError: (error) => {
        toast.error('Failed to upload file', { description: error.message });
      },
    }
  );

  const [updateFileAttachmentMutation, { loading: updateLoading }] = useMutation(
    UPDATE_FILE_ATTACHMENT,
    {
      onCompleted: () => {
        toast.success('File updated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to update file', { description: error.message });
      },
    }
  );

  const [removeFileAttachmentMutation, { loading: removeLoading }] = useMutation(
    REMOVE_FILE_ATTACHMENT,
    {
      onCompleted: (data) => {
        toast.success('File deleted successfully!', {
          description: `"${data.removeFileAttachment.fileName}" has been removed.`,
        });
      },
      onError: (error) => {
        toast.error('Failed to delete file', { description: error.message });
      },
    }
  );

  return {
    createFileAttachment: async (input: {
      fileName: string;
      fileType?: string;
      fileSizeBytes?: number;
      storageUrl: string;
      storageKey: string;
      organizationId: string;
      isPublic?: boolean;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }) => {
      const result = await createFileAttachmentMutation({
        variables: { createFileAttachmentInput: input },
      });
      return result.data?.createFileAttachment;
    },

    updateFileAttachment: async (input: {
      fileAttachmentId: string;
      isPublic?: boolean;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }) => {
      const result = await updateFileAttachmentMutation({
        variables: { updateFileAttachmentInput: input },
      });
      return result.data?.updateFileAttachment;
    },

    removeFileAttachment: async (fileAttachmentId: string) => {
      const result = await removeFileAttachmentMutation({
        variables: { fileAttachmentId },
      });
      return result.data?.removeFileAttachment;
    },

    loading: {
      create: createLoading,
      update: updateLoading,
      remove: removeLoading,
    },
  };
};

// ===================== UTILITY FUNCTIONS =====================

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType?: string): string {
  if (!fileType) return '📄';
  
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('document')) return '📘';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📗';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📙';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return '📦';
  if (fileType.includes('text')) return '📝';
  
  return '📄';
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeBytes = 10 * 1024 * 1024, allowedTypes } = options; // Default 10MB

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSizeBytes)} limit`,
    };
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }
  }

  return { valid: true };
}
