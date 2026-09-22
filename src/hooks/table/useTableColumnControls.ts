"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface ColumnFilterOption {
  value: string;
  label: string;
}

export type ColumnFilterType = "text" | "select";

export type CellValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date;

export interface TableColumnDef<T> {
  id: string;
  /** Value used for default text filter + default sort. */
  accessor: (row: T) => CellValue;
  /** Optional custom comparator (a vs b). Return negative if a < b. */
  compare?: (a: T, b: T) => number;
  /** Override default substring match for text filters. */
  filterFn?: (row: T, filterValue: string) => boolean;
}

export interface UseTableColumnControlsOptions<T> {
  rows: T[];
  columns: TableColumnDef<T>[];
  initialSort?: SortConfig | null;
  /** When true (default), sort cycles asc → desc → none. */
  allowUnsorted?: boolean;
}

function toComparable(value: CellValue): string | number {
  if (value == null) return "";
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  return String(value);
}

function defaultCompare(a: CellValue, b: CellValue): number {
  const av = toComparable(a);
  const bv = toComparable(b);

  if (typeof av === "number" && typeof bv === "number") {
    return av - bv;
  }

  return String(av).localeCompare(String(bv), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function defaultTextFilter(value: CellValue, filterValue: string): boolean {
  if (!filterValue) return true;
  const haystack = String(toComparable(value)).toLowerCase();
  return haystack.includes(filterValue.toLowerCase());
}

export interface ColumnHeaderControls {
  sortDirection: SortDirection;
  filterValue: string;
  isSorted: boolean;
  isFiltered: boolean;
  onSort: () => void;
  onFilterChange: (value: string) => void;
  onClearFilter: () => void;
}

export function useTableColumnControls<T>({
  rows,
  columns,
  initialSort = null,
  allowUnsorted = true,
}: UseTableColumnControlsOptions<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const columnMap = useMemo(() => {
    const map = new Map<string, TableColumnDef<T>>();
    for (const col of columns) map.set(col.id, col);
    return map;
  }, [columns]);

  const toggleSort = useCallback(
    (key: string) => {
      setSortConfig((prev) => {
        if (!prev || prev.key !== key) {
          return { key, direction: "asc" };
        }
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        }
        if (prev.direction === "desc" && allowUnsorted) {
          return null;
        }
        return { key, direction: "asc" };
      });
    },
    [allowUnsorted],
  );

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (!value) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => setFilters({}), []);

  const processedRows = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(
      ([, value]) => value.trim().length > 0,
    );

    let next = rows;

    if (activeFilters.length > 0) {
      next = rows.filter((row) =>
        activeFilters.every(([key, value]) => {
          const col = columnMap.get(key);
          if (!col) return true;
          if (col.filterFn) return col.filterFn(row, value);
          return defaultTextFilter(col.accessor(row), value);
        }),
      );
    }

    if (!sortConfig?.key || !sortConfig.direction) {
      return next;
    }

    const col = columnMap.get(sortConfig.key);
    if (!col) return next;

    const direction = sortConfig.direction === "asc" ? 1 : -1;
    return [...next].sort((a, b) => {
      const result = col.compare
        ? col.compare(a, b)
        : defaultCompare(col.accessor(a), col.accessor(b));
      return result * direction;
    });
  }, [rows, filters, sortConfig, columnMap]);

  const getHeaderProps = useCallback(
    (key: string): ColumnHeaderControls => {
      const filterValue = filters[key] ?? "";
      const isSorted = sortConfig?.key === key && !!sortConfig.direction;
      return {
        sortDirection: isSorted ? sortConfig!.direction : null,
        filterValue,
        isSorted,
        isFiltered: filterValue.trim().length > 0,
        onSort: () => toggleSort(key),
        onFilterChange: (value: string) => setFilter(key, value),
        onClearFilter: () => clearFilter(key),
      };
    },
    [filters, sortConfig, toggleSort, setFilter, clearFilter],
  );

  return {
    sortConfig,
    filters,
    processedRows,
    toggleSort,
    setFilter,
    clearFilter,
    clearAllFilters,
    getHeaderProps,
    hasActiveFilters: Object.values(filters).some((v) => v.trim().length > 0),
  };
}
