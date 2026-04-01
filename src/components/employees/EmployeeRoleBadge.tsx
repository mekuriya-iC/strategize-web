/**
 * Employee Role Badge
 * Displays employee role with appropriate styling
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type EmployeeRole } from "@/types/graphql";

// Role colors following a hierarchy: darker/bolder for higher roles
const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300",
  ADMIN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300",
  DIRECTOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300",
  MANAGER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-300",
  COORDINATOR: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-300",
  NORMAL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300",
};

interface EmployeeRoleBadgeProps {
  role: EmployeeRole | string;
  className?: string;
}

const EmployeeRoleBadge: React.FC<EmployeeRoleBadgeProps> = ({
  role,
  className = "",
}) => {
  const colorClass = roleColors[role] || roleColors.NORMAL;
  const label = ROLE_LABELS[role as EmployeeRole] || role;

  return (
    <Badge 
      variant="outline"
      className={`${colorClass} font-medium ${className}`}
    >
      {label}
    </Badge>
  );
};

export default EmployeeRoleBadge;


