import { format, formatDistanceToNow, isValid } from "date-fns";
import {
  Ban,
  CalendarDays,
  Check,
  Clock3,
  Info,
  Link2,
  MessageSquare,
  UserRound,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TaskCollaborationRequest } from "@/lib/graphql/queries/task-collaboration";
import {
  getAvailableTaskCollaborationActions,
  type TaskCollaborationAction,
} from "./task-collaboration-utils";
import {
  CollaboratorTaskStateBadge,
  TaskRequestStatusBadge,
} from "./task-request-status-badge";

interface RequestCardProps {
  request: TaskCollaborationRequest;
  actionError?: string;
  disabled?: boolean;
  onAction: (
    action: TaskCollaborationAction,
    request: TaskCollaborationRequest,
  ) => void;
}

function formatSchedule(startValue: string, endValue: string) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!isValid(start) || !isValid(end)) {
    return { date: "Schedule unavailable", time: "Time unavailable" };
  }

  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  return {
    date: sameDay
      ? format(start, "EEEE, MMMM d, yyyy")
      : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`,
    time: sameDay
      ? `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
      : `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`,
  };
}

function formatRelativeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date)
    ? formatDistanceToNow(date, { addSuffix: true })
    : null;
}

function RequestMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <MessageSquare className="size-3.5" aria-hidden="true" />
        Request message
      </div>
      <p className="whitespace-pre-wrap text-sm">{message}</p>
    </div>
  );
}

function ActionError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function ReceivedTaskRequestCard({
  request,
  actionError,
  disabled = false,
  onAction,
}: RequestCardProps) {
  const schedule = formatSchedule(
    request.originatorTask.taskStartDate,
    request.originatorTask.taskEndDate,
  );
  const actions = getAvailableTaskCollaborationActions(
    request.status,
    "received",
  );
  const requestedAgo = formatRelativeDate(request.requestedAt);
  const expiresAgo = formatRelativeDate(request.expiresAt);

  return (
    <Card>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4" aria-hidden="true" />
            <span>
              Requested by{" "}
              <span className="font-medium text-foreground">
                {request.originatorEmployee.fullName}
              </span>
            </span>
          </div>
          <CardTitle>
            <h2 className="text-lg leading-snug">
              {request.originatorTask.taskTitle}
            </h2>
          </CardTitle>
          {requestedAgo && (
            <p className="text-xs text-muted-foreground">Requested {requestedAgo}</p>
          )}
        </div>
        <TaskRequestStatusBadge status={request.status} />
      </CardHeader>

      <CardContent className="space-y-4">
        {request.originatorTask.plannedDescription && (
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {request.originatorTask.plannedDescription}
          </p>
        )}

        <div className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <CalendarDays
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{schedule.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock3
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-medium">{schedule.time}</p>
            </div>
          </div>
        </div>

        <RequestMessage message={request.requestMessage} />

        {request.expiresAt && expiresAgo && (
          <p className="text-xs text-muted-foreground">
            This request {new Date(request.expiresAt) > new Date() ? "expires" : "expired"}{" "}
            {expiresAgo}.
          </p>
        )}

        <Alert className="border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
          <Info aria-hidden="true" />
          <AlertDescription>
            Accepting creates a private draft in your matching week. If that week
            was already submitted, it becomes a personal to-do instead.
          </AlertDescription>
        </Alert>

        <ActionError message={actionError} />
      </CardContent>

      {actions.length > 0 && (
        <CardFooter className="flex flex-col-reverse gap-2 border-t sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onAction("reject", request)}
          >
            <X aria-hidden="true" />
            Reject
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onAction("accept", request)}
          >
            <Check aria-hidden="true" />
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function SentTaskRequestCard({
  request,
  actionError,
  disabled = false,
  onAction,
}: RequestCardProps) {
  const schedule = formatSchedule(
    request.originatorTask.taskStartDate,
    request.originatorTask.taskEndDate,
  );
  const actions = getAvailableTaskCollaborationActions(request.status, "sent");
  const requestedAgo = formatRelativeDate(request.requestedAt);
  const statusChangedAgo = formatRelativeDate(
    request.respondedAt ?? request.cancelledAt,
  );

  return (
    <Card>
      <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4" aria-hidden="true" />
            <span>
              Sent to{" "}
              <span className="font-medium text-foreground">
                {request.collaboratorEmployee.fullName}
              </span>
            </span>
          </div>
          <CardTitle>
            <h2 className="text-lg leading-snug">
              {request.originatorTask.taskTitle}
            </h2>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {requestedAgo ? `Requested ${requestedAgo}` : "Request date unavailable"}
            {statusChangedAgo ? ` · Status updated ${statusChangedAgo}` : ""}
          </p>
        </div>
        <TaskRequestStatusBadge status={request.status} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" aria-hidden="true" />
            {schedule.date}
          </span>
          <span className="flex items-center gap-2">
            <Clock3 className="size-4" aria-hidden="true" />
            {schedule.time}
          </span>
        </div>

        <RequestMessage message={request.requestMessage} />

        {request.responseMessage && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Collaborator response
            </p>
            <p className="whitespace-pre-wrap text-sm">{request.responseMessage}</p>
          </div>
        )}

        {request.collaboratorTask && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Link2
                  className="size-4 shrink-0 text-emerald-700 dark:text-emerald-300"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Collaborator task
                  </p>
                  <p className="truncate text-sm font-medium">
                    {request.collaboratorTask.taskTitle}
                  </p>
                </div>
              </div>
              <CollaboratorTaskStateBadge
                status={request.collaboratorTask.submissionStatus}
              />
            </div>
          </div>
        )}

        <ActionError message={actionError} />
      </CardContent>

      {actions.includes("cancel") && (
        <CardFooter className="justify-end border-t">
          <Button
            type="button"
            variant="destructive"
            disabled={disabled}
            onClick={() => onAction("cancel", request)}
          >
            <Ban aria-hidden="true" />
            Cancel request
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
