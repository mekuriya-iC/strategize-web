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
import type {
  CreateFileAttachmentInput,
  UpdateFileAttachmentInput,
} from '@/types/file';

export const useFileAttachments = (
  page = 1,
  limit = 20,
  relatedEntityType?: string,
  relatedEntityId?: string
) => {
  const { data, loading, error, refetch } = useQuery(GET_FILE_ATTACHMENTS, {
    variables: { page, limit, relatedEntityType, relatedEntityId },
    fetchPolicy: 'cache-and-network',
  });

  return {
    files: data?.fileAttachments?.items || [],
    meta: data?.fileAttachments?.meta,
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
    file: data?.fileAttachment,
    loading,
    error,
    refetch,
  };
};

export const useFileAttachmentMutations = () => {
  const [createFile] = useMutation(CREATE_FILE_ATTACHMENT, {
    onCompleted: () => {
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to upload file: ${error.message}`);
    },
    refetchQueries: [GET_FILE_ATTACHMENTS],
  });

  const [updateFile] = useMutation(UPDATE_FILE_ATTACHMENT, {
    onCompleted: () => {
      toast.success('File updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update file: ${error.message}`);
    },
  });

  const [removeFile] = useMutation(REMOVE_FILE_ATTACHMENT, {
    onCompleted: () => {
      toast.success('File removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove file: ${error.message}`);
    },
    refetchQueries: [GET_FILE_ATTACHMENTS],
  });

  return {
    createFile: async (input: CreateFileAttachmentInput) => {
      const result = await createFile({
        variables: { createFileAttachmentInput: input },
      });
      return result.data?.createFileAttachment;
    },
    updateFile: async (input: UpdateFileAttachmentInput) => {
      const result = await updateFile({
        variables: { updateFileAttachmentInput: input },
      });
      return result.data?.updateFileAttachment;
    },
    removeFile: async (fileAttachmentId: string) => {
      const result = await removeFile({
        variables: { fileAttachmentId },
      });
      return result.data?.removeFileAttachment;
    },
  };
};
