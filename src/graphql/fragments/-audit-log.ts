import { gql } from '@apollo/client';

export const AUDITLOG_FRAGMENT = gql`
  fragment AuditLogFields on AuditLog {
    # TODO: Add fields from your schema
    # Example fields:
    # id
    # name
    # createdAt
    # updatedAt
  }
`;
