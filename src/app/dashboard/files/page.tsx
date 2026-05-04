"use client";

import { useState } from "react";
import { useFileAttachments } from "@/hooks/files/useFileAttachments";
import { FileManager } from "@/components/files";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText } from "lucide-react";
import { useAuthStore } from "@/stores";

/**
 * Files Page
 * Centralized file management for all attachments
 */
export default function FilesPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");

  const { files, loading } = useFileAttachments({
    page: 1,
    limit: 100,
    relatedEntityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
  });

  const filteredFiles = files.filter((file) =>
    file.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            File Attachments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all files attached to objectives, KPIs, and initiatives
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="OBJECTIVE">Objectives</SelectItem>
            <SelectItem value="KPI">KPIs</SelectItem>
            <SelectItem value="INITIATIVE">Initiatives</SelectItem>
            <SelectItem value="CHECKIN">Check-ins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Manager */}
      <FileManager
        organizationId={user?.organizationId || "1"}
        title="All Files"
        description={`${filteredFiles.length} file${filteredFiles.length !== 1 ? "s" : ""} found`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {files.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Files</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {files.filter((f) => f.relatedEntityType === "OBJECTIVE").length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Objectives</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {files.filter((f) => f.relatedEntityType === "KPI").length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">KPIs</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {files.filter((f) => f.relatedEntityType === "INITIATIVE").length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Initiatives</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
