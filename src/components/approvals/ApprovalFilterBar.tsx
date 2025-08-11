import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApprovalFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  selectedCount: number;
}

const ApprovalFilterBar: React.FC<ApprovalFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  selectedCount,
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== "all";

  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      {/* Search Input - Left Side */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Right Side Filters and Actions */}
      <div className="flex items-center gap-4">
        {/* Selection Count */}
        {selectedCount > 0 && (
          <div className="text-sm text-gray-600">
            {selectedCount} objective{selectedCount > 1 ? "s" : ""} selected
          </div>
        )}

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

        {/* Status Filter - Right Side */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[100px] border-gray-300">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ApprovalFilterBar;
