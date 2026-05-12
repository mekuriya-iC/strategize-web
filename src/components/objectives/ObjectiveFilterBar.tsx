import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddObjectiveButton from "./AddObjectiveButton";
import { useAuth } from "@/hooks/auth/useAuth";

interface ObjectiveFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  selectedCount: number;
  onAddObjective: () => void;
  showAddButton?: boolean;
  /** The currently active tab — button is only shown on the "corporate" tab */
  activeTab?: string;
}

const ObjectiveFilterBar: React.FC<ObjectiveFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  showAddButton = true,
  activeTab,
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== "all";
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Only show the Add Objective button on the Corporate tab
  const isCorporateTab = !activeTab || activeTab === "corporate";

  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search objectives..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_submitted">Not Submitted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Add Objective Button — only on Corporate tab */}
      {showAddButton && isAdmin && isCorporateTab && <AddObjectiveButton />}
    </div>
  );
};

export default ObjectiveFilterBar;
