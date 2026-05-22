"use client";

import React from "react";
import SubmissionApprovalsTable from "@/components/approvals/SubmissionApprovalsTable";

interface MySubmissionsReportProps {
  onExport?: (data: any) => void;
}

/**
 * My Submissions Report
 * Displays a table of submissions made by the current user
 */
export default function MySubmissionsReport({ onExport }: MySubmissionsReportProps) {
  return (
    <div className="space-y-6">
      <SubmissionApprovalsTable 
        listMode="outbound"
      />
    </div>
  );
}
