"use client";

import { useState } from "react";
import { Bell, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialNotifications = [
  {
    id: 1,
    title: "Increase i-Capital's shareholder value",
    text: "Your objective titled ",
    statusText: " has been approved.",
    time: "2 Hours ago",
    unread: true,
    actionType: "button"
  },
  {
    id: 2,
    title: "Deploy a learning management...",
    text: "Your objective titled ",
    statusText: " has been declined.",
    time: "Today at 2:42 PM",
    unread: false,
    actionType: "button"
  },
  {
    id: 3,
    title: "Deploy a learning management...",
    text: "Your objective titled ",
    statusText: " has been approved.",
    time: "Today at 2:42 PM",
    unread: false,
    actionType: "overflow"
  }
];

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-3 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
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
          <button 
            onClick={markAllAsRead}
            className="text-xs sm:text-sm text-[#3838EC] dark:text-[#5b5bf7] hover:opacity-80 font-medium transition-opacity whitespace-nowrap"
          >
            Mark All as Read
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col max-h-[60vh] sm:max-h-[480px] overflow-y-auto custom-scrollbar pb-2">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-6 ${
                notification.unread 
                  ? "bg-[#F4F6FF] dark:bg-[#3838EC]/5 border-b border-[#E2E8F0] dark:border-gray-800" 
                  : "bg-white dark:bg-[#18181b] border-b border-[#E2E8F0] dark:border-gray-800"
              } last:border-0`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-gray-300 stroke-[1.5]" />
              </div>
              
              <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                <p className="text-sm sm:text-[15px] text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
                  {notification.text}
                  <span className="text-slate-900 dark:text-white font-semibold break-words">"{notification.title}"</span>
                  {notification.statusText}
                </p>
                <p className="text-xs sm:text-[13px] text-slate-400 dark:text-gray-500 font-medium tracking-wide">
                  {notification.time}
                </p>
              </div>

              <div className="ml-2 flex-shrink-0 flex items-center justify-center h-full pt-1">
                {notification.actionType === "button" ? (
                  <button className="px-3 sm:px-5 py-1.5 text-xs font-semibold text-[#3838EC] dark:text-[#5b5bf7] bg-white dark:bg-transparent border border-[#A6A6F5] dark:border-[#3838EC]/50 rounded-[4px] hover:bg-[#F4F6FF] dark:hover:bg-[#3838EC]/10 transition-colors whitespace-nowrap">
                    View
                  </button>
                ) : (
                  <button className="p-1 pt-1.5 text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
