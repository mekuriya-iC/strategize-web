import { gql } from '@apollo/client';

/**
 * Notification Mutations
 */

// Mark notification as read
export const UPDATE_NOTIFICATION = gql`
  mutation UpdateNotification($input: UpdateNotificationInput!) {
    updateNotification(updateNotificationInput: $input) {
      notificationId
      status
      readAt
    }
  }
`;

// Mark as read helper
export const MARK_AS_READ = UPDATE_NOTIFICATION;

// Mark as unread helper
export const MARK_AS_UNREAD = UPDATE_NOTIFICATION;
