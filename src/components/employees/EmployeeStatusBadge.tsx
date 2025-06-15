import React from "react";
import { Badge } from "@/components/ui/badge";

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Deactivated: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={statusColor[status] || "bg-muted text-muted-foreground"}>
      {status}
    </Badge>
  );
};

export default EmployeeStatusBadge;
