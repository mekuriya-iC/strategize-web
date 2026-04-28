import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION,
  GET_UNREAD_COUNT,
} from '@/lib/graphql/queries/notifications';
import {
  CREATE_NOTIFICATION,
  UPDATE_NOTIFICATION,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  REMOVE_NOTIFICATION,
} from '@/lib/graphql/mutations/notifications';
import type {
  NotificationStatus,
  CreateNotificationInput,
  UpdateNotificationInput,
} from '@/types/notification';

export const useNotifications = (
  page = 1,
  limit = 20,
  recipientUserId?: string,
  status?: NotificationStatus
) => {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { page, limit, recipientUserId, status },
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // Poll every 30 seconds for new notifications
  });

  return {
    notifications: data?.notifications?.items || [],
    meta: data?.notifications?.meta,
    loading,
    error,
    refetch,
  };
};

export const useNotification = (notificationId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATION, {
    variables: { notificationId },
    skip: !notificationId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    notification: data?.notification,
    loading,
    error,
    refetch,
  };
};

export const useUnreadCount = (recipientUserId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_UNREAD_COUNT, {
    variables: { recipientUserId },
    skip: !recipientUserId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // Poll every 30 seconds
  });

  return {
    unreadCount: data?.notifications?.meta?.totalItems || 0,
    loading,
    error,
    refetch,
  };
};

export const useNotificationMutations = () => {
  const [createNotification] = useMutation(CREATE_NOTIFICATION, {
    onCompleted: () => {
      toast.success('Notification sent');
    },
    onError: (error) => {
      toast.error(`Failed to send notification: ${error.message}`);
    },
    refetchQueries: [GET_NOTIFICATIONS, GET_UNREAD_COUNT],
  });

  const [updateNotification] = useMutation(UPDATE_NOTIFICATION, {
    onError: (error) => {
      toast.error(`Failed to update notification: ${error.message}`);
    },
  });

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ, {
    onError: (error) => {
      toast.error(`Failed to mark as read: ${error.message}`);
    },
    refetchQueries: [GET_UNREAD_COUNT],
  });

  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => {
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
    refetchQueries: [GET_NOTIFICATIONS, GET_UNREAD_COUNT],
  });

  const [removeNotification] = useMutation(REMOVE_NOTIFICATION, {
    onCompleted: () => {
      toast.success('Notification removed');
    },
    onError: (error) => {
      toast.error(`Failed to remove notification: ${error.message}`);
    },
    refetchQueries: [GET_NOTIFICATIONS, GET_UNREAD_COUNT],
  });

  return {
    createNotification: async (input: CreateNotificationInput) => {
      const result = await createNotification({
        variables: { createNotificationInput: input },
      });
      return result.data?.createNotification;
    },
    updateNotification: async (input: UpdateNotificationInput) => {
      const result = await updateNotification({
        variables: { updateNotificationInput: input },
      });
      return result.data?.updateNotification;
    },
    markAsRead: async (notificationId: string) => {
      const result = await markAsRead({
        variables: { notificationId },
      });
      return result.data?.markNotificationAsRead;
    },
    markAllRead: async (recipientUserId: string) => {
      const result = await markAllRead({
        variables: { recipientUserId },
      });
      return result.data?.markAllNotificationsRead;
    },
    removeNotification: async (notificationId: string) => {
      const result = await removeNotification({
        variables: { notificationId },
      });
      return result.data?.removeNotification;
    },
  };
};
