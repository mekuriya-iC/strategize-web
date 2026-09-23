"use client";

import { useState } from "react";
import StructureBuilder from "@/components/structure/StructureBuilder";
import TemplateEntities from "@/components/structure/TemplateEntities";
import TemplateRoles from "@/components/structure/TemplateRoles";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Layers, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgChart } from "@/hooks/orgChart/useOrgChart";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";

function TemplatesPanel({ canManage }: { canManage: boolean }) {
  return (
    <div className="space-y-6">
      <TemplateEntities canManage={canManage} />
      <TemplateRoles canManage={canManage} />
    </div>
  );
}

export default function StructurePage() {
  const { root, loading, error, refetch } = useOrgChart();
  const canManageStructure = useAuthStore(
    (state) => state.user?.role === "SUPER_ADMIN",
  );
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const handleRefetch = async () => {
    try {
      await refetch();
      toast.success("Structure refreshed");
    } catch {
      toast.error("Failed to refresh structure");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[28rem] flex-col gap-3 lg:h-[calc(100vh-120px)] lg:flex-row lg:gap-6">
      {/* Desktop templates sidebar */}
      <aside className="hidden w-72 shrink-0 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#18181b] lg:block">
        <TemplatesPanel canManage={canManageStructure} />
      </aside>

      {/* Main chart panel */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#18181b]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 dark:border-gray-700 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-600 dark:text-gray-400"
              >
                <path
                  d="M2 4.5C2 3.67157 2.67157 3 3.5 3H12.5C13.3284 3 14 3.67157 14 4.5V11.5C14 12.3284 13.3284 13 12.5 13H3.5C2.67157 13 2 12.3284 2 11.5V4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 6H11M5 9H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
                Company Structure
              </h1>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {root ? root.name : "Organization chart"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Mobile templates drawer */}
            <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 lg:hidden"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span className="text-xs sm:text-sm">Templates</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(20rem,90vw)] overflow-y-auto p-4"
              >
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Structure templates</SheetTitle>
                </SheetHeader>
                <TemplatesPanel canManage={canManageStructure} />
              </SheetContent>
            </Sheet>

            {error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefetch}
                className="gap-1 px-2 text-xs text-red-500"
              >
                <RefreshCw size={12} />
                <span className="hidden sm:inline">Retry</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm">🇬🇧 Eng</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>🇬🇧 English</DropdownMenuItem>
                <DropdownMenuItem>🇫🇷 French</DropdownMenuItem>
                <DropdownMenuItem>🇪🇸 Spanish</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {error && !loading && (
          <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 sm:px-6">
            Could not load live structure — showing sample data. {error.message}
          </div>
        )}

        <StructureBuilder
          templateId="live"
          liveData={root}
          liveLoading={loading}
          canManage={canManageStructure}
        />
      </div>
    </div>
  );
}
