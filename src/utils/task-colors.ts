/**
 * Task Color Coding Utilities
 * Color-codes tasks based on their link type (KPI, Initiative, Self-Development, Unlinked)
 */

export type TaskLinkType =
  | "KPI_FULFILLED"
  | "KPI_UNMET"
  | "INITIATIVE_FULFILLED"
  | "INITIATIVE_UNMET"
  | "SELF_DEVELOPMENT"
  | "UNLINKED";

interface TaskColorConfig {
  background: string;
  border: string;
  text: string;
  badge: string;
  icon: string;
}

/**
 * Get color configuration for a task based on its type
 */
export function getTaskColors(taskType: string): TaskColorConfig {
  const type = taskType as TaskLinkType;

  switch (type) {
    // KPI Tasks - Blue
    case "KPI_FULFILLED":
    case "KPI_UNMET":
      return {
        background: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-900 dark:text-blue-100",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
      };

    // Initiative Tasks - Green
    case "INITIATIVE_FULFILLED":
    case "INITIATIVE_UNMET":
      return {
        background: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-900 dark:text-green-100",
        badge:
          "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        icon: "text-green-600 dark:text-green-400",
      };

    // Self-Development Tasks - Yellow/Amber
    case "SELF_DEVELOPMENT":
      return {
        background: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-900 dark:text-amber-100",
        badge:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
        icon: "text-amber-600 dark:text-amber-400",
      };

    // Unlinked Tasks - Gray
    case "UNLINKED":
    default:
      return {
        background: "bg-gray-50 dark:bg-gray-900/30",
        border: "border-gray-200 dark:border-gray-700",
        text: "text-gray-900 dark:text-gray-100",
        badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        icon: "text-gray-600 dark:text-gray-400",
      };
  }
}

/**
 * Get task category label and color for display
 */
export function getTaskCategory(taskType: string): {
  label: string;
  colorClass: string;
  dotColor: string;
} {
  const type = taskType as TaskLinkType;

  switch (type) {
    case "KPI_FULFILLED":
    case "KPI_UNMET":
      return {
        label: "KPI Task",
        colorClass: "text-blue-700 dark:text-blue-300",
        dotColor: "bg-blue-500",
      };

    case "INITIATIVE_FULFILLED":
    case "INITIATIVE_UNMET":
      return {
        label: "Initiative Task",
        colorClass: "text-green-700 dark:text-green-300",
        dotColor: "bg-green-500",
      };

    case "SELF_DEVELOPMENT":
      return {
        label: "Self-Development",
        colorClass: "text-amber-700 dark:text-amber-300",
        dotColor: "bg-amber-500",
      };

    case "UNLINKED":
    default:
      return {
        label: "Unlinked Task",
        colorClass: "text-gray-700 dark:text-gray-300",
        dotColor: "bg-gray-500",
      };
  }
}

/**
 * Get left border style for task card (used in mobile view)
 */
export function getTaskBorderStyle(taskType: string): string {
  const type = taskType as TaskLinkType;

  switch (type) {
    case "KPI_FULFILLED":
    case "KPI_UNMET":
      return "border-l-4 border-l-blue-500";

    case "INITIATIVE_FULFILLED":
    case "INITIATIVE_UNMET":
      return "border-l-4 border-l-green-500";

    case "SELF_DEVELOPMENT":
      return "border-l-4 border-l-amber-500";

    case "UNLINKED":
    default:
      return "border-l-4 border-l-gray-500";
  }
}
