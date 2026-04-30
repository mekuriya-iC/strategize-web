"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_NOTIFICATIONS } from "@/lib/graphql/queries/notifications";
import { UPDATE_NOTIFICATION } from "@/lib/graphql/mutations/notifications";
import { useAuthContext } from "@/providers/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  UserPlus,
  TrendingUp,
  Calendar,
  Filter,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "APPROVAL_REQUEST":
      return <CheckCircle className="h-6 w-6 text-blue-500" />;
    case "APPROVAL_RESULT":
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case "ASSIGNMENT":
      return <UserPlus className="h-6 w-6 text-purple-500" />;
    case "CHECKIN_REMINDER":
    case "CHECKOUT_REMINDER":
      return <Calendar className="h-6 w-6 text-indigo-500" />;
    case "DEADLINE_REMINDER":
      return <Clock className="h-6 w-6 text-orange-500" />;
    case "EVALUATION_REMINDER":
      return <TrendingUp className="h-6 w-6 text-teal-500" />;
    case "KPI_UPDATE":
      return <TrendingUp className="h-6 w-6 text-green-500" />;
    case "OVERDUE_ALERT":
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    case "SYSTEM_ALERT":
      return <Bell className="h-6 w-6 text-gray-500" />;
    default:
      return <Bell className="h-6 w-6 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "APPROVAL_REQUEST":
      return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900";
    case "APPROVAL_RESULT":
      return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
    case "ASSIGNMENT":
      return "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900";
    case "CHECKIN_REMINDER":
    case "CHECKOUT_REMINDER":
      return "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900";
    case "DEADLINE_REMINDER":
      return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900";
    case "EVALUATION_REMINDER":
      return "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900";
    case "KPI_UPDATE":
      return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900";
    case "OVERDUE_ALERT":
      return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
    case "SYSTEM_ALERT":
      return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900";
    default:
      return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-900";
  }
};

export default function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { user } = useAuthContext();
  const router = useRouter();

  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: {
      page,
      limit: 50,
      recipientUserId: user?.employeeId,
      ...(statusFilter !== "all" && { status: statusFilter.toUpperCase() }),
    },
    skip: !user?.employeeId,
    pollInterval: 30000, // Poll every 30 seconds
  });

  const [updateNotification] = useMutation(UPDATE_NOTIFICATION);

  const notifications = data?.notifications?.items || [];
  const meta = data?.notifications?.meta;
  const unreadCount = notifications.filter((n: any) => n.status === "UNREAD").length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateNotification({
        variables: {
          input: {
            notificationId,
            status: "READ",
            readAt: new Date().toISOString(),
          },
        },
      });
      refetch();
    } catch (error) {
      console.error("❌ Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n: any) => n.status === "UNREAD");
      await Promise.all(
        unreadNotifications.map((notif: any) =>
          updateNotification({
            variables: {
              input: {
                notificationId: notif.notificationId,
                status: "READ",
                readAt: new Date().toISOString(),
              },
            },
          })
        )
      );
      refetch();
    } catch (error) {
      console.error("❌ Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (notification.status === "UNREAD") {
      await handleMarkAsRead(notification.notificationId);
    }

    // Navigate to related entity if available
    if (notification.relatedEntityType && notification.relatedEntityId) {
      const entityType = notification.relatedEntityType.toLowerCase();
      let url = "/dashboard";

      switch (entityType) {
        case "objective":
          url = `/dashboard/objectives/${notification.relatedEntityId}`;
          break;
        case "kpi":
          url = `/dashboard/objectives`;
          break;
        case "checkinoutsession":
          url = `/dashboard/checkin`;
          break;
        case "evaluation":
          url = `/dashboard/evaluations`;
          break;
        case "approval":
          url = `/dashboard/approvals`;
          break;
        default:
          url = "/dashboard";
      }

      router.push(url);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification: any) => (
            <Card
              key={notification.notificationId}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "p-6 cursor-pointer transition-all hover:shadow-md border-l-4",
                getNotificationColor(notification.notificationType),
                notification.status === "UNREAD" && "shadow-sm"
              )}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.notificationType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {notification.status === "UNREAD" && (
                          <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {notification.sender && (
                          <div className="flex items-center gap-2">
                            {notification.sender.picture ? (
                              <img
                                src={notification.sender.picture}
                                alt={notification.sender.fullName}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                                {notification.sender.fullName?.charAt(0)}
                              </div>
                            )}
                            <span>{notification.sender.fullName}</span>
                          </div>
                        )}
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    {notification.status === "UNREAD" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.notificationId);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Bell className="h-16 w-16 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm">
                {statusFilter === "unread"
                  ? "You have no unread notifications"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
