"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { format } from "date-fns";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APPROVE_TASK_PLANNING,
  REJECT_TASK_PLANNING,
} from "@/lib/graphql/mutations/checkins";
import { GET_PENDING_TASK_PLANNING_APPROVALS } from "@/lib/graphql/queries/checkins";
import {
  removeCheckinTaskFromPage,
  removePendingPlanningApproval,
  upsertCheckinTask,
} from "./checkin-cache";

interface PendingPlanningTask {
  checkinoutTaskId: string;
  taskTitle: string;
  taskLinkType?: string | null;
  plannedDescription?: string | null;
  planningRevision: number;
  isMidWeekTask?: boolean;
  submittedAt?: string | null;
  taskStartDate?: string | null;
  taskEndDate?: string | null;
  linkedKpi?: { kpiId: string; name: string } | null;
  linkedInitiative?: { initiativeId: string; title: string } | null;
  session?: {
    employee?: { employeeId: string; fullName: string } | null;
  } | null;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface TaskPlanningApprovalQueueProps {
  sessionId: string;
  canReview: boolean;
}

export function TaskPlanningApprovalQueue({
  sessionId,
  canReview,
}: TaskPlanningApprovalQueueProps) {
  const [rejectingTask, setRejectingTask] = useState<PendingPlanningTask | null>(null);
  const [reason, setReason] = useState("");
  const { data, loading } = useQuery(GET_PENDING_TASK_PLANNING_APPROVALS, {
    variables: { sessionId },
    skip: !canReview,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const tasks = useMemo<PendingPlanningTask[]>(
    () => data?.pendingTaskPlanningApprovals || [],
    [data],
  );

  const [approve, { loading: approving }] = useMutation(APPROVE_TASK_PLANNING, {
    update: (cache, { data: mutationData }) => {
      const task = mutationData?.approveTaskPlanning;
      const taskSessionId = task?.session?.checkinoutSessionId || sessionId;
      if (!task) return;
      removePendingPlanningApproval(cache, taskSessionId, task.checkinoutTaskId);
      upsertCheckinTask(cache, taskSessionId, task);
    },
  });
  const [reject, { loading: rejecting }] = useMutation(REJECT_TASK_PLANNING, {
    update: (cache, { data: mutationData }) => {
      const task = mutationData?.rejectTaskPlanning;
      const taskSessionId = task?.session?.checkinoutSessionId || sessionId;
      if (!task) return;
      removePendingPlanningApproval(cache, taskSessionId, task.checkinoutTaskId);
      removeCheckinTaskFromPage(cache, taskSessionId, task.checkinoutTaskId);
    },
  });

  if (!canReview || (!loading && tasks.length === 0)) return null;

  const handleApprove = async (taskId: string) => {
    try {
      await approve({ variables: { taskId } });
      toast.success("Task planning approved and added to the official list.");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Could not approve task planning."));
    }
  };

  const handleReject = async () => {
    const trimmedReason = reason.trim();
    if (!rejectingTask || !trimmedReason) {
      toast.error("A rejection reason is required.");
      return;
    }
    try {
      await reject({
        variables: { taskId: rejectingTask.checkinoutTaskId, reason: trimmedReason },
      });
      toast.success("Task returned to the employee as an editable draft.");
      setRejectingTask(null);
      setReason("");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Could not reject task planning."));
    }
  };

  return (
    <section className="border-t border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-blue-950 dark:text-blue-100">
            <Clock3 className="h-4 w-4" /> Planning approval queue
          </h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-200/70">
            Pending tasks are visible for review but are not in the official team task list.
          </p>
        </div>
        <Badge className="bg-blue-600 text-white">{loading ? "…" : tasks.length} pending</Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.checkinoutTaskId} className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              {/* Header with title and badges */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{task.taskTitle}</p>
                    <Badge variant="outline" className="text-xs">Revision {task.planningRevision}</Badge>
                    {task.isMidWeekTask && <Badge variant="secondary" className="text-xs">Midweek</Badge>}
                  </div>
                  
                  {/* Employee who submitted */}
                  {task.session?.employee && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      📤 Submitted by: <span className="font-semibold text-gray-900 dark:text-gray-100">{task.session.employee.fullName}</span>
                    </p>
                  )}
                  
                  {/* Description */}
                  {task.plannedDescription && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{task.plannedDescription}</p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    className="gap-1 bg-green-600 text-white hover:bg-green-700"
                    disabled={approving || rejecting}
                    onClick={() => handleApprove(task.checkinoutTaskId)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    disabled={approving || rejecting}
                    onClick={() => {
                      setRejectingTask(task);
                      setReason("");
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
              
              {/* Task details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                {/* Linked KPI or Initiative */}
                {task.linkedKpi ? (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[80px]">Linked KPI:</span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{task.linkedKpi.name}</span>
                  </div>
                ) : task.linkedInitiative ? (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[80px]">Initiative:</span>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{task.linkedInitiative.title}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[80px]">Type:</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Unlinked Task</span>
                  </div>
                )}
                
                {/* Task dates */}
                {task.taskStartDate && task.taskEndDate && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[80px]">Schedule:</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(task.taskStartDate), "MMM d, h:mm a")} - {format(new Date(task.taskEndDate), "h:mm a")}
                    </span>
                  </div>
                )}
                
                {/* Submission time */}
                {task.submittedAt && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[80px]">Submitted:</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{format(new Date(task.submittedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={Boolean(rejectingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingTask(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject task planning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The task returns to DRAFT so the employee can fully edit and resubmit it.
            </p>
            <div className="space-y-2">
              <Label htmlFor="planning-rejection-reason">
                Rejection reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="planning-rejection-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain what must be revised…"
                minLength={1}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectingTask(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={rejecting || !reason.trim()}
                onClick={handleReject}
              >
                {rejecting ? "Rejecting…" : "Reject and return draft"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
