"use client";
import {
  ChevronRight,
  Bell,
  Globe,
  User,
  Menu,
  Sun,
  Moon,
  SidebarClose,
  SidebarOpen,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StrategySelector from "./StrategySelector";
import { useTheme } from "next-themes";
import { useSidebar } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  // Function to get page name from pathname
  const getPageName = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    if (path.startsWith("/dashboard/objectives")) return "Objectives";
    if (path.startsWith("/dashboard/divisions")) return "Divisions";
    if (path.startsWith("/dashboard/departments")) return "Departments";
    if (path.startsWith("/dashboard/employees")) return "Employees";
    if (path.startsWith("/dashboard/reports")) return "Reports";
    if (path.startsWith("/dashboard/approvals")) return "Approvals";
    if (path.startsWith("/dashboard/admin")) return "Admin Panel";
    if (path.startsWith("/dashboard/settings")) return "Settings";
    if (path.startsWith("/strategy-period")) return "Strategy Period";
    return "Dashboard"; // Default fallback
  };

  return (
    <header className="sticky w-full flex items-center justify-between py-4 px-6 bg-white border-b border-[#E2E8F0] dark:bg-[#212123] dark:border-[#212123]">
      {/* Left: Breadcrumbs and filter */}
      <div className="flex items-center gap-4">
        <nav className="flex items-center text-sm text-gray-500">
          {/* Sidebar toggle - visible on all screens */}
          <button
            className="mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3838EC]"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
          >
            {open ? (
              <SidebarClose
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                size={20}
                strokeWidth={1.5}
                color="#3838EC"
              />
            ) : (
              <SidebarOpen
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                size={20}
                strokeWidth={1.5}
                color="#3838EC"
              />
            )}
          </button>
          <span className="font-medium text-gray-700 dark:text-gray-100">
            {getPageName(pathname)}
          </span>
          {/* Strategy selector */}
          <StrategySelector className="w-40 ml-4" />
        </nav>
      </div>
      {/* Right: Icons, language, user */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Theme toggle button */}
        <button
          className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-3 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Eng
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-90" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>French</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-700"
            >
              <User className="w-5 h-5" />
              <span>John Doe</span>
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-90" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Account</DropdownMenuItem>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
