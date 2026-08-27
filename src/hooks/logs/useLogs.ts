import { useQuery } from '@apollo/client';
import { GET_ACTIVITY_LOGS, GET_AUDIT_LOGS, GET_ACTIVITY_LOG, GET_AUDIT_LOG } from '@/lib/graphql/queries/logs';

// Types mapped from schema
export interface ActivityLog {
  activityLogId: string;
  actionSummary: string;
  actionDetail?: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  eventType: string; // ActivityEventType enum
  module: string; // SystemModule enum
  isSuccessful: boolean;
  failureReason?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  browser?: string;
  httpStatusCode?: number;
  createdAt: string;
}

export interface AuditLog {
  auditLogId: string;
  action: string; // AuditAction enum
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemCount: number;
}

interface ActivityLogsQueryVariables {
  page?: number;
  limit?: number;
  module?: string;
  eventType?: string;
  isSuccessful?: boolean;
  userId?: string;
  entityType?: string;
  organizationId?: string;
}

interface AuditLogsQueryVariables {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entityType?: string;
  organizationId?: string;
}

export const useActivityLogs = (variables: ActivityLogsQueryVariables = {}) => {
  const { page = 1, limit = 50, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_ACTIVITY_LOGS, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    activityLogs: (data?.activityLogs?.items || []) as ActivityLog[],
    meta: data?.activityLogs?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useAuditLogs = (variables: AuditLogsQueryVariables = {}) => {
  const { page = 1, limit = 50, ...rest } = variables;
  const { data, loading, error, refetch } = useQuery(GET_AUDIT_LOGS, {
    variables: { page, limit, ...rest },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    auditLogs: (data?.auditLogs?.items || []) as AuditLog[],
    meta: data?.auditLogs?.meta as PaginationMeta | undefined,
    loading,
    error,
    refetch,
  };
};

export const useActivityLog = (activityLogId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_ACTIVITY_LOG, {
    variables: { activityLogId },
    skip: !activityLogId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    activityLog: data?.activityLog as ActivityLog | undefined,
    loading,
    error,
    refetch,
  };
};

export const useAuditLog = (auditLogId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_AUDIT_LOG, {
    variables: { auditLogId },
    skip: !auditLogId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  return {
    auditLog: data?.auditLog as AuditLog | undefined,
    loading,
    error,
    refetch,
  };
};
