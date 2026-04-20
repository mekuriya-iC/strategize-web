"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import OrgStructureBuilder from "@/components/org-structure/OrgStructureBuilder";
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "@/stores";

export default function OrgStructureBuilderPage() {
  const router = useRouter();
  const [topEntityName, setTopEntityName] = useState<string>("");
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Get the top entity name from sessionStorage
    const storedName = sessionStorage.getItem("topEntityName");
    if (!storedName) {
      // If no top entity name, redirect back
      router.push("/org-structure/new");
      return;
    }
    setTopEntityName(storedName);
  }, [router]);

  if (!topEntityName) {
    return null; // Loading or redirecting
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-4 bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo width={120} height={30} />
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Structure</span>
            <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
            <span className="text-sm font-medium text-[#11181C] dark:text-gray-100">
              New Structure
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell size={18} />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 ml-2">
            <UserAvatar />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#11181C] dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col">
        <OrgStructureBuilder topEntityName={topEntityName} />
      </div>
    </div>
  );
}
