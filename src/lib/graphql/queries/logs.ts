import { gql } from '@apollo/client';

export const CORE_ACTIVITY_LOG_FIELDS = gql`
  fragment CoreActivityLogFields on ActivityLog {
    activityLogId
    actionSummary
    actionDetail
    entityType
    entityId
    entityLabel
    eventType
    module
    isSuccessful
    failureReason
    userEmail
    ipAddress
    userAgent
    browser
    httpStatusCode
    createdAt
  }
`;

export const CORE_AUDIT_LOG_FIELDS = gql`
  fragment CoreAuditLogFields on AuditLog {
    auditLogId
    action
    entityType
    entityId
    ipAddress
    userAgent
    createdAt
  }
`;

export const GET_ACTIVITY_LOGS = gql`
  ${CORE_ACTIVITY_LOG_FIELDS}
  query GetActivityLogs(
    $page: Int!
    $limit: Int!
    $module: SystemModule
    $eventType: ActivityEventType
    $isSuccessful: Boolean
    $userId: ID
    $entityType: String
    $organizationId: ID
  ) {
    activityLogs(
      page: $page
      limit: $limit
      module: $module
      eventType: $eventType
      isSuccessful: $isSuccessful
      userId: $userId
      entityType: $entityType
      organizationId: $organizationId
    ) {
      items {
        ...CoreActivityLogFields
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_AUDIT_LOGS = gql`
  ${CORE_AUDIT_LOG_FIELDS}
  query GetAuditLogs(
    $page: Int!
    $limit: Int!
    $action: AuditAction
    $userId: ID
    $entityType: String
    $organizationId: ID
  ) {
    auditLogs(
      page: $page
      limit: $limit
      action: $action
      userId: $userId
      entityType: $entityType
      organizationId: $organizationId
    ) {
      items {
        ...CoreAuditLogFields
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
        itemCount
      }
    }
  }
`;

export const GET_ACTIVITY_LOG = gql`
  ${CORE_ACTIVITY_LOG_FIELDS}
  query GetActivityLog($activityLogId: ID!) {
    activityLog(activityLogId: $activityLogId) {
      ...CoreActivityLogFields
    }
  }
`;

export const GET_AUDIT_LOG = gql`
  ${CORE_AUDIT_LOG_FIELDS}
  query GetAuditLog($auditLogId: ID!) {
    auditLog(auditLogId: $auditLogId) {
      ...CoreAuditLogFields
    }
  }
`;
