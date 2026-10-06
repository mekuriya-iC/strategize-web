"use client";
import {
  ChevronRight,
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
import StrategicPeriodSelector from "./StrategicPeriodSelector";
import DepartmentSelector from "../departments/DepartmentSelector";
import { useTheme } from "next-themes";
import { useUIStore, useAuthStore } from "@/stores";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import NotificationDropdown from "./NotificationDropdown";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const open = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const pathname = usePathname();
  const userPicture = useAuthStore((state) => state.user?.picture);
  const userFullName = useAuthStore((state) => state.user?.fullName);
  const userEmail = useAuthStore((state) => state.user?.email);
  const { logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = () => {
    void logout();
  };

  // Function to get page name from pathname
  const getPageName = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    if (path.startsWith("/dashboard/objectives")) return "Objectives";
    if (path.startsWith("/dashboard/divisions")) return "Divisions";
    if (path.startsWith("/dashboard/departments")) return "Departments";
    if (path.startsWith("/dashboard/employees")) return "Employees";
    if (path.startsWith("/dashboard/reports")) return "Reports";
    if (path.startsWith("/dashboard/semi-annual-report")) return "Semi-Annual Report";
    if (path.startsWith("/dashboard/semi-annual-config")) return "Semi-Annual Configuration";
    if (path.startsWith("/dashboard/approvals/my-submissions"))
      return "My Submissions";
    if (path.startsWith("/dashboard/approvals")) return "Approvals";
    if (path.startsWith("/dashboard/admin")) return "Admin Panel";
    if (path.startsWith("/dashboard/settings")) return "Settings";
    if (path.startsWith("/strategy-period")) return "Strategy Period";
    return "Dashboard"; // Default fallback
  };

  return (
    <div className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/80">
      <header className="flex w-full items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5">
        {/* Left: Breadcrumbs and filter */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <nav className="flex min-w-0 items-center text-sm">
            {/* Sidebar toggle - hamburger on mobile, collapse control on desktop */}
            <button
              className="mr-1 flex-shrink-0 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 sm:mr-2"
              aria-label="Toggle sidebar"
              onClick={toggleSidebar}
            >
              {open ? (
                <SidebarClose
                  className="h-5 w-5"
                  strokeWidth={1.75}
                />
              ) : (
                <SidebarOpen
                  className="h-5 w-5"
                  strokeWidth={1.75}
                />
              )}
            </button>
            <span className="truncate font-bold text-slate-900 dark:text-zinc-100">
              {getPageName(pathname)}
            </span>
            {/* Strategic Period Selector — tablet+ */}
            <div className="ml-3 hidden md:block">
              <StrategicPeriodSelector />
            </div>
            <div className="hidden lg:block ml-2">
              <OrgUnitSelector />
            </div>
            <div className="hidden lg:block">
              <DepartmentSelector className="ml-2" />
            </div>
          </nav>
        </div>
        {/* Right: Icons, language, user */}
        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2.5">
          <NotificationDropdown />

          <button
            className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 text-slate-600 shadow-2xs transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.08] dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:p-2.5"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Language selector - Hidden on mobile */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.08] dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Eng</span>
                  <ChevronRight className="h-3.5 w-3.5 rotate-90 text-slate-400 dark:text-zinc-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/95">
                <DropdownMenuItem className="rounded-xl text-xs font-medium">English</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl text-xs font-medium">French</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 sm:gap-3"
              >
                <UserAvatar
                  src={userPicture}
                  alt={userFullName || "User"}
                  size="sm"
                />
                <span className="hidden sm:inline">
                  {userFullName || "User"}
                </span>
                <ChevronRight className="hidden h-4 w-4 rotate-90 text-gray-500 dark:text-gray-400 sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={userPicture}
                    alt={userFullName || "User"}
                    size="md"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {userFullName || "User"}
                    </span>
                    <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {userEmail || ""}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings?tab=security")}
                className="cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings?tab=profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                All Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile context selectors — period is critical for most pages */}
      <div className="flex gap-2 overflow-x-auto px-3 pb-3 md:hidden">
        <StrategicPeriodSelector />
      </div>
    </div>
  );
}
