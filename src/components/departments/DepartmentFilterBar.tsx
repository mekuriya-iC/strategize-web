import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define filter options type
type FilterStatus =
  | "all"
  | "with_manager"
  | "no_manager"
  | "has_members"
  | "no_members"
  | "recent";

interface DepartmentFilterBarProps {
  onSearchChange?: (searchTerm: string) => void;
  onFilterChange?: (filterValue: FilterStatus) => void;
  searchValue?: string;
  filterValue?: FilterStatus;
  placeholder?: string;
  disabled?: boolean;
}

const DepartmentFilterBar: React.FC<DepartmentFilterBarProps> = ({
  onSearchChange,
  onFilterChange,
  searchValue = "",
  filterValue = "all",
  placeholder = "Search departments...",
  disabled = false,
}) => {
  const [internalSearchValue, setInternalSearchValue] = useState(searchValue);
  const [searchDebounceTimer, setSearchDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Sync internal state with props
  useEffect(() => {
    setInternalSearchValue(searchValue);
  }, [searchValue]);

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setInternalSearchValue(value);

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const newTimer = setTimeout(() => {
      onSearchChange?.(value);
    }, 300); // 300ms debounce

    setSearchDebounceTimer(newTimer);
  };

  // Filter change handler
  const handleFilterChange = (value: FilterStatus) => {
    onFilterChange?.(value);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setInternalSearchValue("");
    onSearchChange?.("");
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setInternalSearchValue("");
    onSearchChange?.("");
    onFilterChange?.("all");
  };

  // Check if any filters are active
  const hasActiveFilters =
    internalSearchValue.trim() !== "" || filterValue !== "all";

  return (
    <div className="flex flex-col md:flex-row rounded-lg gap-2 w-full">
      {/* Search Input Container */}
      <div className="flex border dark:border-gray-700 items-center gap-2 rounded-md w-full md:w-[35%] bg-white dark:bg-gray-900">
        <Search className="h-4 w-4 text-gray-400 ml-3" />

        {/* Search Input */}
        <Input
          type="text"
          placeholder={placeholder}
          value={internalSearchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={disabled}
          className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />

        {/* Clear Search Button */}
        {internalSearchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            disabled={disabled}
            className="h-auto p-1 mr-2 hover:bg-gray-100"
          >
            <X className="h-3 w-3 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Filter Dropdown */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <Select
          value={filterValue}
          onValueChange={handleFilterChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-white dark:bg-gray-900 focus:ring-0 focus:ring-offset-0 shadow-none rounded-md border dark:border-gray-700 min-w-[140px]">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="with_manager">With Manager</SelectItem>
            <SelectItem value="no_manager">No Manager</SelectItem>
            <SelectItem value="has_members">Has Members</SelectItem>
            <SelectItem value="no_members">No Members</SelectItem>
            <SelectItem value="recent">Recently Created</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={disabled}
            className="whitespace-nowrap text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default DepartmentFilterBar;
