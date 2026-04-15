import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// Define table header type
export interface HeaderColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Props interface for the component
interface ReusableTableHeaderProps {
  headers: HeaderColumn[];
  className?: string;
  headerClassName?: string;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
}

const ReusableTableHeader: React.FC<ReusableTableHeaderProps> = ({
  headers,
  className = "border-none",
  headerClassName = "text-[#9E9E9E] dark:text-gray-400 text-[14px] px-6 py-3",
  sortConfig,
  onSort,
}) => {
  const getSortIcon = (headerKey: string) => {
    if (!sortConfig || sortConfig.key !== headerKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1 text-primary" />;
    }

    return <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  return (
    <TableHeader className={className}>
      <TableRow>
        {headers.map((header) => (
          <TableHead
            key={header.key}
            className={`${headerClassName} ${header.sortable !== false && onSort
                ? "cursor-pointer hover:text-[#11181C] dark:hover:text-gray-100 transition-colors select-none"
                : ""
              }`}
            onClick={() => {
              if (header.sortable !== false && onSort) {
                onSort(header.key);
              }
            }}
          >
            <div className="flex items-center">
              {header.label}
              {header.sortable !== false && onSort && getSortIcon(header.key)}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};

export default ReusableTableHeader;
