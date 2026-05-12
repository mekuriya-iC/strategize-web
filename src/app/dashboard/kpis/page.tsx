"use client";

import { useState } from "react";
import { useKpis } from "@/hooks/kpis/useKpis";
import { KpisTable, CreateKpiDialog } from "@/components/kpis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Target } from "lucide-react";
import { useAuthStore } from "@/stores";

export default function KpisPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);

  const user = useAuthStore((state) => state.user);
  const organizationId = user?.organizationId || "";

  const { kpis, loading } = useKpis({
    page: 1,
    limit: 100,
    search: search || undefined,
    organizationId: organizationId || undefined,
  });

  // Filter by type client-side (backend doesn't support type filter yet)
  const filteredKpis = typeFilter
    ? kpis.filter((k) => k.kpiType === typeFilter)
    : kpis;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                KPIs
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Manage Key Performance Indicators and track progress
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New KPI
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total KPIs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.length}</p>
        </div>
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {kpis.filter((k) => k.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Individual</p>
          <p className="text-2xl font-bold text-blue-600">
            {kpis.filter((k) => k.kpiType === "individual").length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shared</p>
          <p className="text-2xl font-bold text-purple-600">
            {kpis.filter((k) => k.kpiType === "shared").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search KPIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="shared">Shared</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <KpisTable
        kpis={filteredKpis}
        loading={loading}
        organizationId={organizationId}
      />

      {/* Create Dialog */}
      <CreateKpiDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        organizationId={organizationId}
      />
    </div>
  );
}
