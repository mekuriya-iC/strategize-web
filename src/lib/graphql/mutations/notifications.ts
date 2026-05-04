import { gql } from '@apollo/client';

/**
 * Notification Mutations
 */

// Mark notification as read
export const UPDATE_NOTIFICATION = gql`
  mutation UpdateNotification($updateNotificationInput: UpdateNotificationInput!) {
    updateNotification(updateNotificationInput: $updateNotificationInput) {
      notificationId
      status
      readAt
    }
  }
`;

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($createNotificationInput: CreateNotificationInput!) {
    createNotification(createNotificationInput: $createNotificationInput) {
      notificationId
      title
      status
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = UPDATE_NOTIFICATION;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($recipientUserId: ID!) {
    markAllNotificationsRead(recipientUserId: $recipientUserId)
  }
`;

export const REMOVE_NOTIFICATION = gql`
  mutation RemoveNotification($notificationId: ID!) {
    removeNotification(notificationId: $notificationId) {
      notificationId
    }
  }
`;
