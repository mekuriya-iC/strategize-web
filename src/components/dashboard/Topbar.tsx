"use client";
import { ChevronRight, Bell, Globe, User, Menu, Sun, Moon } from "lucide-react";
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

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 bg-white border-b border-[#E2E8F0] dark:bg-[#212123] dark:border-[#212123]">
      {/* Left: Breadcrumbs and filter */}
      <div className="flex items-center gap-4">
        <nav className="flex items-center text-sm text-gray-500">
          <button
            className="mr-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3838EC]"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
          >
            <Menu
              className="w-5 h-5 text-gray-700"
              size={20}
              strokeWidth={1.5}
              color="#3838EC"
            />
          </button>
          <span className="font-medium text-gray-700 dark:text-gray-100">Dashboard</span>
          <ChevronRight className="mx-2 w-4 h-4" />
          {/* Strategy selector */}
          <StrategySelector className="w-40" />
        </nav>
      </div>
      {/* Right: Icons, language, user */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-500">
          <Bell className="w-5 h-5" />
        </Button>
        {/* Theme toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-700"
            >
              <Globe className="w-4 h-4" /> Eng
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Eng</DropdownMenuItem>
            <DropdownMenuItem>Fr</DropdownMenuItem>
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
