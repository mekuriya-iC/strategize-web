import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface SearchAndFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions?: FilterOption[];
}

const defaultFilterOptions: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Managed by Me", value: "managed" },
  { label: "Recently Created", value: "recent" },
];

export default function SearchAndFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filterOptions = defaultFilterOptions,
}: SearchAndFilterBarProps) {
  return (
    <div className="flex gap-4 items-center w-full">
      <Input
        placeholder="Search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-sm"
      />
      <Select value={filter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-32" />
        <SelectContent>
          {filterOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
