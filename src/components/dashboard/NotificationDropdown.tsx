"use client";

import { useState } from "react";
import { Bell, ClipboardCheck, FileCheck2 } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_NOTIFICATIONS } from "@/lib/graphql/queries/notifications";
import { UPDATE_NOTIFICATION } from "@/lib/graphql/mutations/notifications";
import { usePendingApprovalsCount } from "@/hooks/submissions/usePendingApprovalsCount";
import { useAuthContext } from "@/providers/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthContext();
  const router = useRouter();
  const {
    count: pendingApprovalCount,
    submissionCount,
    logbookCount,
    loading: approvalsLoading,
  } = usePendingApprovalsCount();

  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: {
      page: 1,
      limit: 20,
      recipientUserId: user?.employeeId,
    },
    skip: !user?.employeeId,
    pollInterval: 30000, // Poll every 30 seconds for new notifications
  });

  const [updateNotification] = useMutation(UPDATE_NOTIFICATION);

  // Filter out notifications with null recipients
  const notifications = (data?.notifications?.items || []).filter(
    (n: any) => n.recipient != null
  );
  const unreadCount = notifications.filter((n: any) => n.status === "UNREAD").length;
  const bellBadgeCount = pendingApprovalCount > 0 ? pendingApprovalCount : unreadCount;

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const unreadNotifications = notifications.filter((n: any) => n.status === "UNREAD");
      await Promise.all(
        unreadNotifications.map((notif: any) =>
          updateNotification({
            variables: {
              updateNotificationInput: {
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
      try {
        await updateNotification({
          variables: {
            updateNotificationInput: {
              notificationId: notification.notificationId,
              status: "READ",
              readAt: new Date().toISOString(),
            },
          },
        });
        refetch();
      } catch (error) {
        console.error("❌ Failed to mark notification as read:", error);
      }
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
          url = `/dashboard/objectives`; // KPIs are shown in objectives page
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
        case "logbook_entry":
        case "logbookentry":
          url = `/dashboard/approvals?tab=logbook`;
          break;
        default:
          url = "/dashboard";
      }

      setOpen(false);
      router.push(url);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-3 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          {bellBadgeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-40"></span>
              <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {bellBadgeCount > 99 ? "99+" : bellBadgeCount}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] p-0 overflow-hidden rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-gray-800 bg-white dark:bg-[#18181b]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs sm:text-sm text-[#3838EC] dark:text-[#5b5bf7] hover:opacity-80 font-medium transition-opacity whitespace-nowrap"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {(approvalsLoading || pendingApprovalCount > 0) && (
          <div className="border-y border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approval requests
            </p>
            {approvalsLoading ? (
              <div className="h-14 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {submissionCount > 0 && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard/approvals");
                    }}
                    className="flex items-center gap-3 rounded-lg border bg-white p-3 text-left transition-colors hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/20"
                  >
                    <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">Objectives & KPIs</span>
                      <span className="text-xs text-muted-foreground">{submissionCount} pending</span>
                    </span>
                  </button>
                )}
                {logbookCount > 0 && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard/approvals?tab=logbook");
                    }}
                    className="flex items-center gap-3 rounded-lg border bg-white p-3 text-left transition-colors hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/20"
                  >
                    <FileCheck2 className="h-4 w-4 text-indigo-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">Logbooks</span>
                      <span className="text-xs text-muted-foreground">{logbookCount} pending</span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent persisted notifications */}
        <div className="flex flex-col max-h-[60vh] sm:max-h-[480px] overflow-y-auto custom-scrollbar pb-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <div 
                key={notification.notificationId}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  notification.status === "UNREAD"
                    ? "bg-[#F4F6FF] dark:bg-[#3838EC]/5 border-b border-[#E2E8F0] dark:border-gray-800" 
                    : "bg-white dark:bg-[#18181b] border-b border-[#E2E8F0] dark:border-gray-800"
                } last:border-0`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-gray-300 stroke-[1.5]" />
                </div>
                
                <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                  <p className="text-sm sm:text-[15px] text-slate-900 dark:text-white font-semibold break-words">
                    {notification.title}
                  </p>
                  <p className="text-sm sm:text-[14px] text-slate-600 dark:text-gray-300 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2">
                    {notification.sender && (
                      <span className="text-xs sm:text-[13px] text-slate-500 dark:text-gray-400 font-medium">
                        {notification.sender.fullName}
                      </span>
                    )}
                    <span className="text-xs sm:text-[13px] text-slate-400 dark:text-gray-500 font-medium tracking-wide">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="ml-2 flex-shrink-0 flex items-center justify-center h-full pt-1">
                  {notification.status === "UNREAD" && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#E2E8F0] dark:border-gray-800">
          <button
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/notifications");
            }}
            className="w-full text-sm text-[#3838EC] dark:text-[#5b5bf7] hover:opacity-80 font-medium transition-opacity py-2"
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
