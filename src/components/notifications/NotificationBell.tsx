'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_NOTIFICATIONS } from '@/lib/graphql/queries/notifications';
import { UPDATE_NOTIFICATION } from '@/lib/graphql/mutations/notifications';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import { useAuthContext } from '@/providers/AuthProvider';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthContext();

  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: {
      page: 1,
      limit: 20,
      recipientUserId: user?.employeeId,
      status: 'UNREAD',
    },
    skip: !user?.employeeId,
    pollInterval: 30000, // Poll every 30 seconds for new notifications
  });

  const [updateNotification] = useMutation(UPDATE_NOTIFICATION);

  const notifications = data?.notifications?.items || [];
  const unreadCount = notifications.length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateNotification({
        variables: {
          input: {
            notificationId,
            readAt: new Date().toISOString(),
          },
        },
      });
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map((notif: any) =>
          updateNotification({
            variables: {
              input: {
                notificationId: notif.notificationId,
                readAt: new Date().toISOString(),
              },
            },
          })
        )
      );
      refetch();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length > 0 ? (
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClose={() => setOpen(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full text-sm text-indigo-600 hover:text-indigo-700"
            onClick={() => {
              setOpen(false);
              // Navigate to notifications page
              window.location.href = '/dashboard/notifications';
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
