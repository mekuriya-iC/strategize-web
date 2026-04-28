import { gql } from '@apollo/client';

/**
 * File Attachment Mutations
 */
export const CREATE_FILE_ATTACHMENT = gql`
  mutation CreateFileAttachment($createFileAttachmentInput: CreateFileAttachmentInput!) {
    createFileAttachment(createFileAttachmentInput: $createFileAttachmentInput) {
      fileAttachmentId
      fileName
      fileType
      fileSizeBytes
      storageUrl
      storageKey
      isPublic
      relatedEntityType
      relatedEntityId
      createdAt
    }
  }
`;

export const UPDATE_FILE_ATTACHMENT = gql`
  mutation UpdateFileAttachment($updateFileAttachmentInput: UpdateFileAttachmentInput!) {
    updateFileAttachment(updateFileAttachmentInput: $updateFileAttachmentInput) {
      fileAttachmentId
      fileName
      isPublic
    }
  }
`;

export const REMOVE_FILE_ATTACHMENT = gql`
  mutation RemoveFileAttachment($fileAttachmentId: ID!) {
    removeFileAttachment(fileAttachmentId: $fileAttachmentId) {
      fileAttachmentId
      fileName
    }
  }
`;
