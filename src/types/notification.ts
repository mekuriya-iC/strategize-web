/**
 * Notification System Types
 */

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  OBJECTIVE_ASSIGNED = 'OBJECTIVE_ASSIGNED',
  OBJECTIVE_APPROVED = 'OBJECTIVE_APPROVED',
  OBJECTIVE_REJECTED = 'OBJECTIVE_REJECTED',
  KPI_ASSIGNED = 'KPI_ASSIGNED',
  KPI_UPDATE_APPROVED = 'KPI_UPDATE_APPROVED',
  KPI_UPDATE_REJECTED = 'KPI_UPDATE_REJECTED',
  CHECKIN_SUBMITTED = 'CHECKIN_SUBMITTED',
  CHECKIN_APPROVED = 'CHECKIN_APPROVED',
  CHECKIN_REJECTED = 'CHECKIN_REJECTED',
  LOGBOOK_SUBMITTED = 'LOGBOOK_SUBMITTED',
  LOGBOOK_APPROVED = 'LOGBOOK_APPROVED',
  LOGBOOK_REJECTED = 'LOGBOOK_REJECTED',
  EVALUATION_ASSIGNED = 'EVALUATION_ASSIGNED',
  EVALUATION_SUBMITTED = 'EVALUATION_SUBMITTED',
  EVALUATION_COMPLETED = 'EVALUATION_COMPLETED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_GRANTED = 'APPROVAL_GRANTED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  REMINDER = 'REMINDER',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  MENTION = 'MENTION',
}

export interface Notification {
  notificationId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  status: NotificationStatus;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sender?: {
    employeeId: string;
    fullName: string;
    email?: string;
    picture?: string;
  };
  recipient: {
    employeeId: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
}

// Input types for mutations
export interface CreateNotificationInput {
  title: string;
  message: string;
  notificationType: NotificationType;
  recipientUserId: string;
  senderUserId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  organizationId: string;
}

export interface UpdateNotificationInput {
  notificationId: string;
  status?: NotificationStatus;
  readAt?: string;
}
