import { gql } from '@apollo/client';

/**
 * File Attachment Queries
 */
export const GET_FILE_ATTACHMENTS = gql`
  query GetFileAttachments(
    $page: Int!
    $limit: Int!
    $relatedEntityType: String
    $relatedEntityId: ID
  ) {
    fileAttachments(
      page: $page
      limit: $limit
      relatedEntityType: $relatedEntityType
      relatedEntityId: $relatedEntityId
    ) {
      items {
        fileAttachmentId
        fileName
        fileType
        fileSizeBytes
        storageUrl
        storageKey
        isPublic
        relatedEntityType
        relatedEntityId
        uploadedBy {
          employeeId
          fullName
          picture
        }
        createdAt
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export const GET_FILE_ATTACHMENT = gql`
  query GetFileAttachment($fileAttachmentId: ID!) {
    fileAttachment(fileAttachmentId: $fileAttachmentId) {
      fileAttachmentId
      fileName
      fileType
      fileSizeBytes
      storageUrl
      storageKey
      isPublic
      relatedEntityType
      relatedEntityId
      uploadedBy {
        employeeId
        fullName
        email
        picture
      }
      createdAt
    }
  }
`;
