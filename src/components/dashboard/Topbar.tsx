"use client";
import {
  ChevronRight,
  Bell,
  Globe,
  Sun,
  Moon,
  SidebarClose,
  SidebarOpen,
  LogOut,
  Settings,
  User,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import OrgUnitSelector from "./OrgUnitSelector";
import StrategySelector from "./StrategySelector";
import DepartmentSelector from "../departments/DepartmentSelector";
import { useTheme } from "next-themes";
import { useUIStore, useAuthStore } from "@/stores";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const { sidebarOpen: open, toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

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
          <OrgUnitSelector />
          <DepartmentSelector className="ml-4" />
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
              className="flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <UserAvatar
                src={user?.picture}
                alt={user?.fullName || "User"}
                size="sm"
              />
              <span className="hidden sm:inline">
                {user?.fullName || "User"}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-90" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled>
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user?.picture}
                  alt={user?.fullName || "User"}
                  size="md"
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user?.fullName || "User"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {user?.email || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings?tab=security")}
              className="cursor-pointer"
            >
              <Shield className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings?tab=profile")}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              All Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
