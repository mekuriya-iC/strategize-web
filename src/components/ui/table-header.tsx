"use client";

import React from "react";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import {
  SortableFilterableHeader,
  type SortableFilterableHeaderProps,
} from "@/components/ui/sortable-filterable-header";
import type {
  ColumnFilterOption,
  ColumnFilterType,
  SortConfig,
  SortDirection,
} from "@/hooks/table/useTableColumnControls";
import { cn } from "@/lib/utils";

export type { SortConfig, SortDirection };

export interface HeaderColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  filterOptions?: ColumnFilterOption[];
  filterPlaceholder?: string;
  align?: SortableFilterableHeaderProps["align"];
  className?: string;
  /** Render custom content (e.g. checkbox) instead of sortable/filterable header. */
  render?: () => React.ReactNode;
}

interface ReusableTableHeaderProps {
  headers: HeaderColumn[];
  className?: string;
  headerClassName?: string;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  filters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
}

const ReusableTableHeader: React.FC<ReusableTableHeaderProps> = ({
  headers,
  className = "border-none",
  headerClassName = "text-[#9E9E9E] dark:text-gray-400 text-[14px] px-6 py-3",
  sortConfig,
  onSort,
  filters,
  onFilterChange,
}) => {
  return (
    <TableHeader className={className}>
      <TableRow>
        {headers.map((header) => {
          const sortable = header.sortable !== false && !!onSort && !header.render;
          const filterable =
            header.filterable === true && !!onFilterChange && !header.render;
          const sortDirection =
            sortConfig?.key === header.key ? sortConfig.direction : null;

          return (
            <TableHead
              key={header.key}
              className={cn(headerClassName, header.className)}
            >
              {header.render ? (
                header.render()
              ) : (
                <SortableFilterableHeader
                  label={header.label}
                  sortable={sortable}
                  filterable={filterable}
                  filterType={header.filterType}
                  filterOptions={header.filterOptions}
                  filterPlaceholder={header.filterPlaceholder}
                  sortDirection={sortDirection}
                  filterValue={filters?.[header.key] ?? ""}
                  onSort={sortable ? () => onSort?.(header.key) : undefined}
                  onFilterChange={
                    filterable
                      ? (value) => onFilterChange?.(header.key, value)
                      : undefined
                  }
                  onClearFilter={
                    filterable
                      ? () => onFilterChange?.(header.key, "")
                      : undefined
                  }
                  align={header.align}
                />
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
};

export default ReusableTableHeader;
