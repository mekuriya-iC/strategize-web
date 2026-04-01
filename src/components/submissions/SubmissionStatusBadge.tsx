"use client";

import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/types/graphql";

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-700 hover:bg-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 hover:bg-red-200",
  },
} as const;

export default function SubmissionStatusBadge({
  status,
  className,
}: SubmissionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={`${config.className} ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}
