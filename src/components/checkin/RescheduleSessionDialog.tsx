"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { CalendarClock, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RESCHEDULE_CHECKINOUT_SESSIONS } from "@/lib/graphql/mutations/checkins";
import { isMonday } from "@/utils/checkin-schedule-groups";
import type { CheckinoutSessionLike } from "@/utils/checkin-session-groups";

interface RescheduleSessionDialogProps {
  open: boolean;
  sessions: CheckinoutSessionLike[];
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void | Promise<void>;
}

const dateValue = (value?: string | null) => value?.slice(0, 10) ?? "";

const daysBetween = (start: string, end: string) =>
  Math.round(
    (new Date(`${end}T00:00:00.000Z`).getTime() -
      new Date(`${start}T00:00:00.000Z`).getTime()) /
      86_400_000,
  );

export function RescheduleSessionDialog({
  open,
  sessions,
  onOpenChange,
  onUpdated,
}: RescheduleSessionDialogProps) {
  const first = sessions[0];
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");
  const generatedWeek = Boolean(first?.scheduleWeekId);
  const blocked = sessions.some((session) => session.hasApprovedTasks);
  const originalDuration = useMemo(
    () =>
      first
        ? daysBetween(
            dateValue(first.weekStartDate),
            dateValue(first.weekEndDate),
          )
        : 0,
    [first],
  );

  useEffect(() => {
    if (!open || !first) return;
    setWeekStartDate(dateValue(first.weekStartDate));
    setWeekEndDate(dateValue(first.weekEndDate));
  }, [first, open]);

  const [reschedule, { loading }] = useMutation(RESCHEDULE_CHECKINOUT_SESSIONS);

  const dateRangeValid = Boolean(
    weekStartDate &&
      weekEndDate &&
      weekStartDate <= weekEndDate &&
      (!generatedWeek ||
        (isMonday(weekStartDate) &&
          daysBetween(weekStartDate, weekEndDate) === originalDuration)),
  );
  const unchanged =
    weekStartDate === dateValue(first?.weekStartDate) &&
    weekEndDate === dateValue(first?.weekEndDate);

  const submit = async () => {
    if (!first || blocked || !dateRangeValid || unchanged) return;
    try {
      await reschedule({
        variables: {
          input: {
            checkinoutSessionIds: sessions.map(
              (session) => session.checkinoutSessionId,
            ),
            weekStartDate,
            weekEndDate,
          },
        },
      });
      toast.success(
        sessions.length > 1
          ? "The check-in week was rescheduled for all participants."
          : "The check-in session was rescheduled.",
      );
      await onUpdated();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not reschedule this check-in session.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-600" />
            Reschedule check-in session
          </DialogTitle>
          <DialogDescription>
            {generatedWeek
              ? `This generated week has ${sessions.length} participant session${sessions.length === 1 ? "" : "s"}. All of them will move together.`
              : "Change the session dates before any task in it has been approved."}
          </DialogDescription>
        </DialogHeader>

        {blocked ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <Lock className="h-4 w-4" /> Editing is disabled
            </p>
            <p className="mt-1">
              At least one task in this session has already been approved, so
              its dates are now fixed.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reschedule-week-start">Start date</Label>
                <Input
                  id="reschedule-week-start"
                  type="date"
                  value={weekStartDate}
                  onChange={(event) => setWeekStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-week-end">End date</Label>
                <Input
                  id="reschedule-week-end"
                  type="date"
                  value={weekEndDate}
                  onChange={(event) => setWeekEndDate(event.target.value)}
                />
              </div>
            </div>
            {weekStartDate && weekEndDate && weekStartDate > weekEndDate && (
              <p className="text-sm text-red-600">
                End date must be on or after the start date.
              </p>
            )}
            {generatedWeek && weekStartDate && !isMonday(weekStartDate) && (
              <p className="text-sm text-red-600">
                A generated schedule week must start on Monday.
              </p>
            )}
            {generatedWeek &&
              weekStartDate &&
              weekEndDate &&
              weekStartDate <= weekEndDate &&
              daysBetween(weekStartDate, weekEndDate) !== originalDuration && (
                <p className="text-sm text-red-600">
                  Keep the original {originalDuration + 1}-day week length when
                  moving a generated schedule week.
                </p>
              )}
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
              Existing draft and pending tasks move by the same number of days.
              The update is rejected if it would overlap another session or move
              a task outside the new date range.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button
              type="button"
              onClick={submit}
              disabled={!dateRangeValid || unchanged || loading}
            >
              {loading ? "Saving…" : "Save new dates"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
