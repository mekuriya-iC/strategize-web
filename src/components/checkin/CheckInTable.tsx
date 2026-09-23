"use client";

import { useMemo } from "react";
import {
  DataTableCards,
  DataTableDesktop,
} from "@/components/ui/responsive-table";
import { SortableFilterableHeader } from "@/components/ui/sortable-filterable-header";
import { useTableColumnControls } from "@/hooks/table/useTableColumnControls";
import { CheckInTableRow } from "./CheckInTableRow";
import { CheckInTableCard } from "./CheckInTableCard";
import type {
  TaskPlanningReview,
  TaskSubmissionStatus,
} from "./weekly-submission";

interface Task {
  id: string;
  taskType: string;
  task: string;
  description: string;
  relatedTo: string;
  startTime: string;
  endTime: string;
  checkoutStatus: string;
  requiresApproval?: boolean;
  approvedAt?: string | null;
  attachment?: string;
  remark?: string;
  linkedKpiName?: string;
  linkedInitiativeName?: string;
  isKpiMet: boolean;
  isInitiativeMet: boolean;
  isSelfDevComplete: boolean;
  createdAt: string;
  isMidWeekTask?: boolean;
  submissionStatus?: TaskSubmissionStatus;
  logbookStatus?: string | null;
  planningRevision?: number;
  planningReviewHistory?: TaskPlanningReview[];
  carryoverGeneration?: number;
  isCarryoverOverdue?: boolean;
  carryoverEscalatedAt?: string | null;
  sessionId?: string | null;
}

interface CheckInTableProps {
  tasks: Task[];
  createdDate: Date;
  endDate?: Date;
  searchQuery: string;
  onRefetch: () => void;
  onEditTask?: (task: Task) => void;
  isEditable?: boolean;
  isSelectionEnabled?: boolean;
  selectedTaskIds?: ReadonlySet<string>;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  onSubmitForApproval?: (taskId: string) => void | Promise<void>;
  submittingTaskForApproval?: boolean;
  filters?: {
    objective: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    attachment: "all" | "yes" | "no";
    checkoutStatus: string[];
  };
}

const thClass =
  "px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

export function CheckInTable({
  tasks,
  createdDate,
  endDate,
  searchQuery,
  onRefetch,
  onEditTask,
  filters,
  isEditable = true,
  isSelectionEnabled = false,
  selectedTaskIds = new Set<string>(),
  onSelectionChange,
  onSubmitForApproval,
  submittingTaskForApproval = false,
}: CheckInTableProps) {
  void createdDate;
  void endDate;

  const baseFilteredTasks = useMemo(() => {
    let filtered = tasks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.task.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.relatedTo?.toLowerCase().includes(query) ||
          task.linkedKpiName?.toLowerCase().includes(query) ||
          task.linkedInitiativeName?.toLowerCase().includes(query),
      );
    }

    if (filters) {
      if (filters.objective) {
        filtered = filtered.filter((task) => {
          if (filters.objective === "kpi_unmet") return !task.isKpiMet;
          if (filters.objective === "kpi_fulfilled") return task.isKpiMet;
          if (filters.objective === "initiative_unmet")
            return !task.isInitiativeMet;
          if (filters.objective === "initiative_fulfilled")
            return task.isInitiativeMet;
          return true;
        });
      }

      if (filters.startDate) {
        filtered = filtered.filter((task) => {
          const taskDate = new Date(task.startTime);
          return taskDate >= filters.startDate!;
        });
      }
      if (filters.endDate) {
        filtered = filtered.filter((task) => {
          const taskDate = new Date(task.endTime);
          return taskDate <= filters.endDate!;
        });
      }

      if (filters.attachment === "yes") {
        filtered = filtered.filter((task) => task.attachment);
      } else if (filters.attachment === "no") {
        filtered = filtered.filter((task) => !task.attachment);
      }

      if (filters.checkoutStatus.length > 0) {
        filtered = filtered.filter((task) =>
          filters.checkoutStatus.includes(task.checkoutStatus),
        );
      }
    }

    return filtered;
  }, [tasks, searchQuery, filters]);

  const columns = useMemo(
    () => [
      {
        id: "task",
        accessor: (task: Task) => task.task,
        filterFn: (task: Task, value: string) => {
          const q = value.toLowerCase();
          return (
            task.task.toLowerCase().includes(q) ||
            (task.description?.toLowerCase().includes(q) ?? false)
          );
        },
      },
      {
        id: "linkedTo",
        accessor: (task: Task) =>
          task.linkedKpiName ||
          task.linkedInitiativeName ||
          task.relatedTo ||
          "",
      },
      {
        id: "schedule",
        accessor: (task: Task) => task.startTime,
        compare: (a: Task, b: Task) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      },
      {
        id: "file",
        accessor: (task: Task) => (task.attachment ? "yes" : "no"),
        filterFn: (task: Task, value: string) =>
          value === "yes" ? !!task.attachment : !task.attachment,
      },
      {
        id: "checkout",
        accessor: (task: Task) => task.checkoutStatus,
        filterFn: (task: Task, value: string) =>
          task.checkoutStatus.toLowerCase() === value.toLowerCase(),
      },
    ],
    [],
  );

  const {
    processedRows: filteredTasks,
    getHeaderProps,
    sortConfig,
  } = useTableColumnControls({
    rows: baseFilteredTasks,
    columns,
    initialSort: null,
    allowUnsorted: true,
  });

  // Stable fallback when no column sort is active
  const displayTasks = useMemo(() => {
    if (sortConfig?.direction) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [filteredTasks, sortConfig]);

  const taskHdr = getHeaderProps("task");
  const linkedHdr = getHeaderProps("linkedTo");
  const scheduleHdr = getHeaderProps("schedule");
  const fileHdr = getHeaderProps("file");
  const checkoutHdr = getHeaderProps("checkout");

  return (
    <>
      <DataTableDesktop className="overflow-hidden rounded-b-lg border border-t-0 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[920px] table-fixed">
            <colgroup>
              {isSelectionEnabled && onSelectionChange && (
                <col className="w-12" />
              )}
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] border-b border-gray-200 bg-gray-50/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <tr>
                {isSelectionEnabled && onSelectionChange && (
                  <th className={thClass}>Select</th>
                )}
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Task"
                    {...taskHdr}
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Linked to"
                    {...linkedHdr}
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Schedule"
                    filterable={false}
                    {...scheduleHdr}
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="File"
                    filterType="select"
                    filterOptions={[
                      { value: "yes", label: "Has file" },
                      { value: "no", label: "No file" },
                    ]}
                    {...fileHdr}
                  />
                </th>
                <th className={thClass}>
                  <SortableFilterableHeader
                    label="Checkout"
                    filterType="select"
                    filterOptions={[
                      { value: "PENDING", label: "Pending" },
                      { value: "CHECKED_OUT", label: "Checked out" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                    ]}
                    {...checkoutHdr}
                  />
                </th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/80">
              {displayTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSelectionEnabled ? 7 : 6}
                    className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No tasks match this view.
                  </td>
                </tr>
              ) : (
                displayTasks.map((task) => (
                  <CheckInTableRow
                    key={task.id}
                    task={task}
                    isEditable={isEditable}
                    onRefetch={onRefetch}
                    onEditTask={onEditTask}
                    isSelectionEnabled={isSelectionEnabled}
                    isSelected={selectedTaskIds.has(task.id)}
                    onSelectionChange={onSelectionChange}
                    onSubmitForApproval={onSubmitForApproval}
                    submittingTaskForApproval={submittingTaskForApproval}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataTableDesktop>

      <DataTableCards>
        {displayTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No tasks match this view.
          </div>
        ) : (
          displayTasks.map((task) => (
            <CheckInTableCard
              key={task.id}
              task={task}
              isEditable={isEditable}
              onRefetch={onRefetch}
              onEditTask={onEditTask}
              isSelectionEnabled={isSelectionEnabled}
              isSelected={selectedTaskIds.has(task.id)}
              onSelectionChange={onSelectionChange}
              onSubmitForApproval={onSubmitForApproval}
              submittingTaskForApproval={submittingTaskForApproval}
            />
          ))
        )}
      </DataTableCards>
    </>
  );
}
