"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  EyeIcon,
  LockIcon,
  SendIcon,
} from "lucide-react";
import {
  canSubmitWeeklyTasks,
  WEEKLY_SUBMISSION_CONFIRMATION,
} from "./weekly-submission";

export interface TaskPoolSummary {
  sessionId: string;
  draftCount: number;
  submittedCount: number;
  personalTodoCount: number;
  activeCount: number;
  remainingCapacity: number;
  minimumSubmissionCount: number;
  maximumSubmissionCount: number;
  maximumActiveTaskCount: number;
}

interface WeeklySubmissionPanelProps {
  summary?: TaskPoolSummary;
  selectedCount: number;
  selectedKpiFulfilledCount: number;
  alreadySubmitted: boolean;
  sessionReadOnly?: boolean;
  loading?: boolean;
  submitting?: boolean;
  onSubmit: () => void | Promise<void>;
}

export function WeeklySubmissionPanel({
  summary,
  selectedCount,
  selectedKpiFulfilledCount,
  alreadySubmitted,
  sessionReadOnly = false,
  loading = false,
  submitting = false,
  onSubmit,
}: WeeklySubmissionPanelProps) {
  const minimum = summary?.minimumSubmissionCount ?? 6;
  const maximum = summary?.maximumSubmissionCount ?? 10;
  const activeCount = summary?.activeCount ?? 0;
  const capacity = summary?.maximumActiveTaskCount ?? 15;
  const countIsValid = selectedCount >= minimum && selectedCount <= maximum;
  const hasKpiFulfilled = selectedKpiFulfilledCount >= 1;
  const selectionIsValid = canSubmitWeeklyTasks(
    selectedCount,
    selectedKpiFulfilledCount,
    minimum,
    maximum,
  );
  const submitDisabled =
    loading ||
    submitting ||
    alreadySubmitted ||
    sessionReadOnly ||
    !selectionIsValid;

  return (
    <section
      aria-labelledby="weekly-task-pool-heading"
      className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2
              id="weekly-task-pool-heading"
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              Weekly task pool
            </h2>
            <Badge variant="outline" className="text-sm font-bold">
              {loading ? "…" : `${activeCount}/${capacity}`}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select {minimum}–{maximum} draft tasks for this week’s supervisor
            submission.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Task pool status counts">
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            DRAFT {summary?.draftCount ?? 0}
          </Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            SUBMITTED {summary?.submittedCount ?? 0}
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            PERSONAL_TODO {summary?.personalTodoCount ?? 0}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-900/40">
        <p className="font-semibold text-gray-900 dark:text-white">
          Submission checklist
        </p>
        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {countIsValid ? (
            <CheckCircle2Icon className="h-4 w-4 text-green-600" aria-hidden="true" />
          ) : (
            <AlertCircleIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />
          )}
          {selectedCount}/{minimum}–{maximum} draft tasks selected
        </p>
        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {hasKpiFulfilled ? (
            <CheckCircle2Icon className="h-4 w-4 text-green-600" aria-hidden="true" />
          ) : (
            <AlertCircleIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />
          )}
          {selectedKpiFulfilledCount} KPI_FULFILLED selected (at least 1 required)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The linked logbook may remain Draft when you submit the weekly plan; it
          does not need Monday submission or approval, but you must submit it by
          session end.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40 md:flex-row md:items-center md:justify-between">
        <div>
          {sessionReadOnly ? (
            <p className="flex items-start gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              This session is locked or closed. Weekly task submission is no
              longer editable.
            </p>
          ) : alreadySubmitted ? (
            <p className="flex items-start gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              This week is already submitted. Tasks added later are private
              personal to-dos and cannot be submitted this week.
            </p>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedCount} selected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only DRAFT tasks can be selected. Personal to-dos stay private
                and are visible only to you.
              </p>
            </>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={submitDisabled}
              className="gap-2 bg-[#3838EC] text-white hover:bg-[#2d2dbd]"
            >
              <SendIcon className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Submitting…" : "Submit weekly tasks"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Submit {selectedCount} tasks for this week?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">{WEEKLY_SUBMISSION_CONFIRMATION}</span>
                <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  Your supervisor will see only the selected submitted tasks.
                </span>
                <span className="block">
                  A KPI_FULFILLED task creates a Draft logbook achievement. The
                  logbook can stay Draft now, but must be submitted by session end.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={onSubmit}
                className="bg-[#3838EC] text-white hover:bg-[#2d2dbd]"
              >
                Confirm submission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
