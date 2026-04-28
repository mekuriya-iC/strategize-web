import { gql } from '@apollo/client';

/**
 * Notification Queries
 */
export const GET_NOTIFICATIONS = gql`
  query GetNotifications(
    $page: Int!
    $limit: Int!
    $recipientUserId: ID
    $status: NotificationStatus
  ) {
    notifications(
      page: $page
      limit: $limit
      recipientUserId: $recipientUserId
      status: $status
    ) {
      items {
        notificationId
        title
        message
        notificationType
        status
        readAt
        relatedEntityType
        relatedEntityId
        sender {
          employeeId
          fullName
          picture
        }
        recipient {
          employeeId
          fullName
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

export const GET_NOTIFICATION = gql`
  query GetNotification($notificationId: ID!) {
    notification(notificationId: $notificationId) {
      notificationId
      title
      message
      notificationType
      status
      readAt
      relatedEntityType
      relatedEntityId
      sender {
        employeeId
        fullName
        email
        picture
      }
      recipient {
        employeeId
        fullName
        email
      }
      createdAt
    }
  }
`;

/**
 * Get unread notification count
 * Uses the notifications query with status filter
 */
export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount($recipientUserId: ID!) {
    notifications(
      page: 1
      limit: 1
      recipientUserId: $recipientUserId
      status: UNREAD
    ) {
      meta {
        totalItems
      }
    }
  }
`;
