import { gql } from '@apollo/client';

/**
 * Notification Mutations
 */
export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($createNotificationInput: CreateNotificationInput!) {
    createNotification(createNotificationInput: $createNotificationInput) {
      notificationId
      title
      message
      notificationType
      status
      createdAt
    }
  }
`;

export const UPDATE_NOTIFICATION = gql`
  mutation UpdateNotification($updateNotificationInput: UpdateNotificationInput!) {
    updateNotification(updateNotificationInput: $updateNotificationInput) {
      notificationId
      status
      readAt
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: ID!) {
    updateNotification(
      updateNotificationInput: {
        notificationId: $notificationId
        status: READ
      }
    ) {
      notificationId
      status
      readAt
    }
  }
`;

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
