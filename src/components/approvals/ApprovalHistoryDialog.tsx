"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApprovalHistoryDialogProps {
  objectiveId?: string;
  kpiId?: string;
  children?: React.ReactNode;
}

export default function ApprovalHistoryDialog({
  objectiveId,
  kpiId,
  children,
}: ApprovalHistoryDialogProps) {
  const [open, setOpen] = useState(false);

  // Fetch all submissions for this objective or KPI
  const { data, loading } = useQuery(GET_SUBMISSIONS, {
    variables: {
      page: 1,
      limit: 100,
      type: "CORPORATE", // We'll filter client-side
    },
    skip: !open || (!objectiveId && !kpiId),
  });

  const submissions = (data?.submissions?.items || []).filter((sub: any) => {
    if (objectiveId) {
      return sub.objective?.objectiveId === objectiveId;
    }
    if (kpiId) {
      return sub.kpi?.kpiId === kpiId;
    }
    return false;
  });

  // Sort by date (newest first)
  const sortedSubmissions = [...submissions].sort((a: any, b: any) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      APPROVED: {
        label: "Approved",
        className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      },
      REJECTED: {
        label: "Rejected",
        className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      },
      PENDING: {
        label: "Pending",
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      },
    };

    const { label, className } = config[status] || config.PENDING;
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            View History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Approval History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : sortedSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No approval history found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {sortedSubmissions.map((submission: any, index: number) => (
                <div
                  key={submission.submissionId}
                  className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  {/* Timeline connector */}
                  {index < sortedSubmissions.length - 1 && (
                    <div className="absolute left-[22px] top-[60px] bottom-[-16px] w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative z-10 bg-white dark:bg-gray-900 p-1">
                        {getStatusIcon(submission.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(submission.status)}
                          <span className="text-xs text-gray-500">
                            {submission.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {submission.type === "OBJECTIVE"
                            ? submission.objective?.title || submission.objective?.name
                            : submission.kpi?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="ml-11 space-y-2">
                    {/* Submitted By */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>
                        Submitted by:{" "}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {submission.submittedBy?.fullName || "Unknown"}
                        </span>
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(submission.createdAt)}</span>
                    </div>

                    {/* Level */}
                    {submission.level && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Level:</span>
                        <Badge variant="outline" className="text-xs">
                          {submission.level}
                        </Badge>
                      </div>
                    )}

                    {/* Reason/Comment */}
                    {submission.reason && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {submission.status === "APPROVED"
                                ? "Approval Comment"
                                : submission.status === "REJECTED"
                                ? "Rejection Reason"
                                : "Comment"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {submission.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actioned By (if available) */}
                    {submission.actionedBy && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <User className="h-4 w-4" />
                        <span>
                          {submission.status === "APPROVED" ? "Approved" : "Rejected"} by:{" "}
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {submission.actionedBy.fullName}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
