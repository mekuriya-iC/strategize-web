import { gql } from '@apollo/client';

/**
 * Notification Queries
 */

// Get paginated notifications
export const GET_NOTIFICATIONS = gql`
  query GetNotifications(
    $page: Int!
    $limit: Int!
    $recipientUserId: ID
    $status: NotificationStatus
    $organizationId: ID
  ) {
    notifications(
      page: $page
      limit: $limit
      recipientUserId: $recipientUserId
      status: $status
      organizationId: $organizationId
    ) {
      items {
        notificationId
        title
        message
        notificationType
        status
        readAt
        createdAt
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

// Get single notification
export const GET_NOTIFICATION = gql`
  query GetNotification($notificationId: ID!) {
    notification(notificationId: $notificationId) {
      notificationId
      title
      message
      notificationType
      status
      readAt
      createdAt
      relatedEntityType
      relatedEntityId
      sender {
        employeeId
        fullName
        picture
        email
      }
      recipient {
        employeeId
        fullName
        email
      }
    }
  }
`;
