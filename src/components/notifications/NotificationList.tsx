'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  UserPlus,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types/notification';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'APPROVAL_REQUEST':
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    case 'APPROVAL_RESULT':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'ASSIGNMENT':
      return <UserPlus className="h-5 w-5 text-purple-500" />;
    case 'CHECKIN_REMINDER':
    case 'CHECKOUT_REMINDER':
      return <Calendar className="h-5 w-5 text-indigo-500" />;
    case 'DEADLINE_REMINDER':
      return <Clock className="h-5 w-5 text-orange-500" />;
    case 'EVALUATION_REMINDER':
      return <TrendingUp className="h-5 w-5 text-teal-500" />;
    case 'KPI_UPDATE':
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    case 'OVERDUE_ALERT':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'SYSTEM_ALERT':
      return <Bell className="h-5 w-5 text-gray-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'APPROVAL_REQUEST':
      return 'bg-blue-50 hover:bg-blue-100';
    case 'APPROVAL_RESULT':
      return 'bg-green-50 hover:bg-green-100';
    case 'ASSIGNMENT':
      return 'bg-purple-50 hover:bg-purple-100';
    case 'CHECKIN_REMINDER':
    case 'CHECKOUT_REMINDER':
      return 'bg-indigo-50 hover:bg-indigo-100';
    case 'DEADLINE_REMINDER':
      return 'bg-orange-50 hover:bg-orange-100';
    case 'EVALUATION_REMINDER':
      return 'bg-teal-50 hover:bg-teal-100';
    case 'KPI_UPDATE':
      return 'bg-green-50 hover:bg-green-100';
    case 'OVERDUE_ALERT':
      return 'bg-red-50 hover:bg-red-100';
    case 'SYSTEM_ALERT':
      return 'bg-gray-50 hover:bg-gray-100';
    default:
      return 'bg-gray-50 hover:bg-gray-100';
  }
};

export function NotificationList({
  notifications,
  onMarkAsRead,
  onClose,
}: NotificationListProps) {
  const router = useRouter();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (notification.status === 'UNREAD') {
      onMarkAsRead(notification.notificationId);
    }

    // Navigate to related entity if available
    if (notification.relatedEntityType && notification.relatedEntityId) {
      const entityType = notification.relatedEntityType.toLowerCase();
      let url = '/dashboard';

      switch (entityType) {
        case 'objective':
          url = `/dashboard/objectives/${notification.relatedEntityId}`;
          break;
        case 'kpi':
          url = `/dashboard/objectives`; // KPIs are shown in objectives page
          break;
        case 'checkinoutsession':
          url = `/dashboard/checkin`;
          break;
        case 'evaluation':
          url = `/dashboard/evaluations`;
          break;
        case 'approval':
          url = `/dashboard/approvals`;
          break;
        default:
          url = '/dashboard';
      }

      onClose();
      router.push(url);
    }
  };

  return (
    <div className="divide-y">
      {notifications.map((notification) => (
        <div
          key={notification.notificationId}
          onClick={() => handleNotificationClick(notification)}
          className={cn(
            'p-4 cursor-pointer transition-colors',
            getNotificationColor(notification.notificationType),
            notification.status === 'UNREAD' && 'border-l-4 border-indigo-500'
          )}
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.notificationType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-gray-900 line-clamp-1">
                  {notification.title}
                </p>
                {notification.status === 'UNREAD' && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {notification.sender && (
                  <div className="flex items-center gap-1">
                    {notification.sender.picture ? (
                      <img
                        src={notification.sender.picture}
                        alt={notification.sender.fullName}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                        {notification.sender.fullName?.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {notification.sender.fullName}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
