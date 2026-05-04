"use client";

import type { Initiative } from "@/hooks/initiatives/useInitiatives";

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  ON_HOLD: {
    label: "On Hold",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

export default function InitiativeStatusBadge({
  status,
}: {
  status: Initiative["status"];
}) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
