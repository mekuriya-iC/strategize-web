"use client";

import React from "react";
import { useSubmissions } from "@/hooks/useSubmissions";
import SubmissionStatusBadge from "./SubmissionStatusBadge";
import { format } from "date-fns";
import { Clock, User } from "lucide-react";
import type { ObjectiveType } from "@/types/graphql";

interface SubmissionHistoryProps {
  itemId: string; // objectiveId or kpiId
  itemType: "objective" | "kpi";
  type: ObjectiveType; // CORPORATE, DIVISION, etc.
  className?: string;
}

export default function SubmissionHistory({
  itemId,
  itemType,
  type,
  className = "",
}: SubmissionHistoryProps) {
  const { submissions, loading, error } = useSubmissions({
    page: 1,
    limit: 50, // Get more submissions for history
    type,
  });

  // Filter submissions for this specific item
  const itemSubmissions = submissions.filter((submission) => {
    if (itemType === "objective") {
      return submission.objective?.objectiveId === itemId;
    } else {
      return submission.kpi?.kpiId === itemId;
    }
  });

  // Sort by most recent first
  const sortedSubmissions = itemSubmissions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700">
          Submission History
        </h4>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <h4 className="text-sm font-medium text-gray-700">
          Submission History
        </h4>
        <p className="text-sm text-red-600 mt-2">
          Error loading submission history: {error.message}
        </p>
      </div>
    );
  }

  if (sortedSubmissions.length === 0) {
    return (
      <div className={`${className}`}>
        <h4 className="text-sm font-medium text-gray-700">
          Submission History
        </h4>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 text-center">
            No submissions yet for this {itemType}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Submission History ({sortedSubmissions.length})
      </h4>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sortedSubmissions.map((submission) => (
          <div
            key={submission.submissionId}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            {/* Header with status and date */}
            <div className="flex items-center justify-between mb-2">
              <SubmissionStatusBadge status={submission.status} />
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {format(
                  new Date(submission.createdAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </div>
            </div>

            {/* Submitted by */}
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {submission.submittedBy.fullName}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({submission.level.toLowerCase()})
              </span>
            </div>

            {/* Reason */}
            {submission.reason && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span>{" "}
                  {submission.reason}
                </p>
              </div>
            )}

            {/* Updated date if different from created */}
            {submission.updatedAt &&
              submission.updatedAt !== submission.createdAt && (
                <div className="mt-2 text-xs text-gray-500">
                  Updated:{" "}
                  {format(
                    new Date(submission.updatedAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
