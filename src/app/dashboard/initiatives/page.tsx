"use client";

import { useState } from "react";
import { useInitiatives } from "@/hooks/initiatives/useInitiatives";
import { useQuery } from "@apollo/client";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { InitiativeTable, CreateInitiativeDialog } from "@/components/initiatives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Rocket } from "lucide-react";

export default function InitiativesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);

  const { initiatives, loading } = useInitiatives({
    page: 1,
    limit: 100,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  // Fetch objectives for the create dialog
  const { data: objData } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 500 },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  const objectives = (objData?.objectives?.items || []).map(
    (o: { objectiveId: string; title: string }) => ({
      objectiveId: o.objectiveId,
      title: o.title,
    })
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Initiatives
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Manage strategic initiatives and track execution progress
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Initiative
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search initiatives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <InitiativeTable initiatives={initiatives} loading={loading} />

      {/* Create Dialog */}
      <CreateInitiativeDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        objectives={objectives}
      />
    </div>
  );
}
