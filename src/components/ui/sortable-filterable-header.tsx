"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  ColumnFilterOption,
  ColumnFilterType,
  SortDirection,
} from "@/hooks/table/useTableColumnControls";

export interface SortableFilterableHeaderProps {
  label: React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  filterOptions?: ColumnFilterOption[];
  filterPlaceholder?: string;
  sortDirection?: SortDirection;
  filterValue?: string;
  onSort?: () => void;
  onFilterChange?: (value: string) => void;
  onClearFilter?: () => void;
  className?: string;
  /** Extra classes for the outer flex row */
  contentClassName?: string;
  align?: "left" | "center" | "right";
}

const ALL_SELECT_VALUE = "__all__";

export function SortableFilterableHeader({
  label,
  sortable = true,
  filterable = true,
  filterType = "text",
  filterOptions = [],
  filterPlaceholder,
  sortDirection = null,
  filterValue = "",
  onSort,
  onFilterChange,
  onClearFilter,
  className,
  contentClassName,
  align = "left",
}: SortableFilterableHeaderProps) {
  const isFiltered = filterValue.trim().length > 0;
  const canSort = sortable && !!onSort;
  const canFilter = filterable && !!onFilterChange;

  const sortIcon = (() => {
    if (!canSort) return null;
    if (sortDirection === "asc") {
      return <ArrowUp className="size-3.5 text-primary" aria-hidden />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="size-3.5 text-primary" aria-hidden />;
    }
    return (
      <ArrowUpDown className="size-3.5 opacity-40 group-hover/header:opacity-70" aria-hidden />
    );
  })();

  const sortLabel =
    sortDirection === "asc"
      ? `Sort ${typeof label === "string" ? label : "column"} ascending`
      : sortDirection === "desc"
        ? `Sort ${typeof label === "string" ? label : "column"} descending`
        : `Sort ${typeof label === "string" ? label : "column"}`;

  const filterLabel = `Filter ${typeof label === "string" ? label : "column"}`;

  return (
    <div
      className={cn(
        "group/header flex min-w-0 items-center gap-0.5",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-0.5",
          contentClassName,
        )}
      >
        {canSort ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSort?.();
            }}
            className={cn(
              "inline-flex min-w-0 items-center gap-1 rounded-sm text-inherit",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              "touch-manipulation",
            )}
            aria-label={sortLabel}
          >
            <span className="truncate">{label}</span>
            {sortIcon}
          </button>
        ) : (
          <span className="truncate">{label}</span>
        )}

        {canFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 min-h-6 min-w-6 shrink-0 touch-manipulation p-0",
                  isFiltered
                    ? "text-primary"
                    : "text-muted-foreground opacity-50 hover:opacity-100",
                )}
                aria-label={filterLabel}
                aria-pressed={isFiltered}
                onClick={(e) => e.stopPropagation()}
              >
                <Filter className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 space-y-2 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium">{filterLabel}</Label>
                {isFiltered && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    onClick={() => {
                      onClearFilter?.();
                      onFilterChange?.("");
                    }}
                  >
                    <X className="mr-0.5 size-3" />
                    Clear
                  </Button>
                )}
              </div>

              {filterType === "select" ? (
                <Select
                  value={filterValue || ALL_SELECT_VALUE}
                  onValueChange={(value) =>
                    onFilterChange?.(value === ALL_SELECT_VALUE ? "" : value)
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SELECT_VALUE}>All</SelectItem>
                    {filterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={filterValue}
                  onChange={(e) => onFilterChange?.(e.target.value)}
                  placeholder={filterPlaceholder ?? "Contains…"}
                  className="h-8"
                  autoFocus
                  aria-label={filterLabel}
                />
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export default SortableFilterableHeader;
