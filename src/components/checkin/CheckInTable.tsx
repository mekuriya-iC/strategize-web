"use client";

import { useMemo } from "react";
import { CheckInTableRow } from "./CheckInTableRow";
import { CheckInTableCard } from "./CheckInTableCard";
import type { TaskSubmissionStatus } from "./weekly-submission";

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
  filters?: {
    objective: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    attachment: "all" | "yes" | "no";
    checkoutStatus: string[];
  };
}

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
}: CheckInTableProps) {
  void createdDate;
  void endDate;
  // Filter tasks based on search query and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.task.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.relatedTo?.toLowerCase().includes(query),
      );
    }

    // Apply filters
    if (filters) {
      // Filter by objective
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

      // Filter by date range
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

      // Filter by attachment
      if (filters.attachment === "yes") {
        filtered = filtered.filter((task) => task.attachment);
      } else if (filters.attachment === "no") {
        filtered = filtered.filter((task) => !task.attachment);
      }

      // Filter by checkout status
      if (filters.checkoutStatus.length > 0) {
        filtered = filtered.filter((task) =>
          filters.checkoutStatus.includes(task.checkoutStatus),
        );
      }
    }

    return filtered;
  }, [tasks, searchQuery, filters]);

  // Action visibility is ownership-based.
  // If the current viewer owns this session's tasks, show edit/delete actions.
  // Team members' tasks remain view-only.

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {isSelectionEnabled && onSelectionChange && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Select
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Major Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Linked KPI/Initiative
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Objective
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Related With
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Time & Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End Time & Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Attachment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Checkout
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Remark
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map((task) => (
                <CheckInTableRow
                  key={task.id}
                  task={task}
                  isEditable={isEditable}
                  onRefetch={onRefetch}
                  onEditTask={onEditTask}
                  isSelectionEnabled={isSelectionEnabled}
                  isSelected={selectedTaskIds.has(task.id)}
                  onSelectionChange={onSelectionChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {filteredTasks.map((task) => (
          <CheckInTableCard
            key={task.id}
            task={task}
            isEditable={isEditable}
            onRefetch={onRefetch}
            onEditTask={onEditTask}
            isSelectionEnabled={isSelectionEnabled}
            isSelected={selectedTaskIds.has(task.id)}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </div>
    </>
  );
}
