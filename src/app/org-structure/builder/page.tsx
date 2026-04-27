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
    const storedName = sessionStorage.getItem("topEntityName");
    if (!storedName) {
      router.push("/org-structure/new");
      return;
    }
    setTopEntityName(storedName);
  }, [router]);

  if (!topEntityName) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] flex flex-col">
      {/* Header */}
      <header className="w-full px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 md:gap-4">
          <Logo width={100} height={25} className="md:w-[120px] md:h-[30px]" />
          
          {/* Breadcrumbs - Hidden on mobile, visible on small screens up */}
          <div className="hidden sm:flex items-center gap-2 ml-2 md:ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Structure</span>
            <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
            <span className="text-xs md:text-sm font-medium text-[#11181C] dark:text-gray-100 truncate max-w-[100px] md:max-w-none">
              New Structure
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
            <Bell size={18} />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 ml-1 md:ml-2">
            <UserAvatar className="h-8 w-8 md:h-9 md:w-9" />
            {/* User Info - Hidden on mobile and tablets, visible on Large screens */}
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-medium text-[#11181C] dark:text-gray-100 leading-none">
                {user?.fullName}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 md:p-6 flex flex-col overflow-hidden">
        {/* 
          Wrapper for the builder to ensure it handles internal 
          scrolling if the org chart is larger than the screen 
        */}
        <div className="flex-1 bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
          <OrgStructureBuilder topEntityName={topEntityName} />
        </div>
      </main>
    </div>
  );
}