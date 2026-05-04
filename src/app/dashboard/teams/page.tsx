"use client";

import { useState } from "react";
import { useTeams } from "@/hooks/teams/useTeams";
import TeamsTable from "@/components/teams/TeamsTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: deptsData } = useQuery(GET_DEPARTMENTS, {
    variables: { page: 1, limit: 100 },
  });
  const departments = deptsData?.departments?.items || [];

  const { teams: allTeams, loading } = useTeams({
    page: 1,
    limit: 100,
    search: search || undefined,
    departmentId: departmentFilter !== "all" ? departmentFilter : undefined,
  });

  // Filter by status client-side since backend doesn't support it
  const teams = statusFilter === "all" 
    ? allTeams 
    : allTeams.filter(team => 
        statusFilter === "active" ? team.isActive : !team.isActive
      );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept: any) => (
              <SelectItem key={dept.departmentId} value={dept.departmentId}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <TeamsTable teams={teams} loading={loading} />
    </div>
  );
}
