"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, Inbox, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ACCEPT_TASK_COLLABORATION_REQUEST,
  CANCEL_TASK_COLLABORATION_REQUEST,
  REJECT_TASK_COLLABORATION_REQUEST,
  type CancelTaskCollaborationRequestVariables,
  type RespondTaskCollaborationRequestVariables,
} from "@/lib/graphql/mutations/task-collaboration";
import {
  GET_PENDING_TASK_COLLABORATION_REQUESTS,
  GET_SENT_TASK_COLLABORATION_REQUESTS,
  type PendingTaskCollaborationRequestsData,
  type SentTaskCollaborationRequestsData,
  type TaskCollaborationRequest,
} from "@/lib/graphql/queries/task-collaboration";
import { TaskRequestActionDialog } from "./task-request-action-dialog";
import {
  ReceivedTaskRequestCard,
  SentTaskRequestCard,
} from "./task-request-cards";
import {
  getActionableCollaborationError,
  type TaskCollaborationAction,
} from "./task-collaboration-utils";

type ConfirmationState = {
  action: TaskCollaborationAction;
  request: TaskCollaborationRequest;
};

const SUCCESS_MESSAGES: Record<TaskCollaborationAction, string> = {
  accept: "Collaboration request accepted",
  reject: "Collaboration request rejected",
  cancel: "Collaboration request cancelled",
};

function RequestListSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading task collaboration requests">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-6 w-3/5" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RequestListError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Could not load collaboration requests</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function EmptyRequests({ view }: { view: "received" | "sent" }) {
  const Icon = view === "received" ? Inbox : Send;
  return (
    <Card>
      <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="font-semibold">
          {view === "received" ? "No pending requests" : "No sent requests"}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {view === "received"
            ? "New task collaboration requests sent to you will appear here."
            : "Task collaboration requests you send will appear here with their current status."}
        </p>
      </CardContent>
    </Card>
  );
}

export function TaskRequestsView() {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  // NOTE: Task collaboration is not yet implemented on the backend.
  // Skip both queries until the backend supports these operations.
  const receivedQuery = useQuery<PendingTaskCollaborationRequestsData>(
    GET_PENDING_TASK_COLLABORATION_REQUESTS,
    {
      skip: true,
      fetchPolicy: "cache-and-network",
      pollInterval: 30_000,
      notifyOnNetworkStatusChange: true,
    },
  );
  const sentQuery = useQuery<SentTaskCollaborationRequestsData>(
    GET_SENT_TASK_COLLABORATION_REQUESTS,
    {
      skip: true,
      fetchPolicy: "cache-and-network",
      pollInterval: 30_000,
      notifyOnNetworkStatusChange: true,
    },
  );

  const [acceptRequest] = useMutation<
    unknown,
    RespondTaskCollaborationRequestVariables
  >(ACCEPT_TASK_COLLABORATION_REQUEST, { errorPolicy: "none" });
  const [rejectRequest] = useMutation<
    unknown,
    RespondTaskCollaborationRequestVariables
  >(REJECT_TASK_COLLABORATION_REQUEST, { errorPolicy: "none" });
  const [cancelRequest] = useMutation<
    unknown,
    CancelTaskCollaborationRequestVariables
  >(CANCEL_TASK_COLLABORATION_REQUEST, { errorPolicy: "none" });

  const received =
    receivedQuery.data?.pendingTaskCollaborationRequests ?? [];
  const sent = sentQuery.data?.sentTaskCollaborationRequests ?? [];
  const pendingCount = received.length;

  const openConfirmation = (
    action: TaskCollaborationAction,
    request: TaskCollaborationRequest,
  ) => {
    setActionErrors((current) => {
      const next = { ...current };
      delete next[request.requestId];
      return next;
    });
    setConfirmation({ action, request });
  };

  const performConfirmedAction = async (responseMessage?: string) => {
    if (!confirmation) return false;

    const { action, request } = confirmation;
    setSubmitting(true);
    setActionErrors((current) => {
      const next = { ...current };
      delete next[request.requestId];
      return next;
    });

    try {
      if (action === "accept") {
        await acceptRequest({
          variables: {
            input: { requestId: request.requestId, responseMessage },
          },
        });
      } else if (action === "reject") {
        await rejectRequest({
          variables: {
            input: { requestId: request.requestId, responseMessage },
          },
        });
      } else {
        await cancelRequest({ variables: { requestId: request.requestId } });
      }

      const refreshResults = await Promise.allSettled([
        receivedQuery.refetch(),
        sentQuery.refetch(),
      ]);
      toast.success(SUCCESS_MESSAGES[action]);
      if (refreshResults.some((result) => result.status === "rejected")) {
        toast.warning("Request updated, but the lists could not be refreshed", {
          description: "Use Try again in the affected list to load the latest status.",
        });
      }
      return true;
    } catch (error) {
      const message = getActionableCollaborationError(error);
      setActionErrors((current) => ({
        ...current,
        [request.requestId]: message,
      }));
      toast.error("Could not update collaboration request", {
        description: message,
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Task collaboration requests
          </h1>
          {!receivedQuery.loading && (
            <Badge
              variant={pendingCount > 0 ? "default" : "secondary"}
              aria-label={`${pendingCount} pending task collaboration request${pendingCount === 1 ? "" : "s"}`}
            >
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Review tasks shared with you and track requests you have sent.
        </p>
      </header>

      <Tabs defaultValue="received">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:min-w-72">
          <TabsTrigger value="received">
            Received
            {!receivedQuery.loading && (
              <span
                className="rounded-full bg-background/80 px-1.5 text-xs tabular-nums"
                aria-label={`${pendingCount} pending`}
              >
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4">
          {receivedQuery.loading && !receivedQuery.data ? (
            <RequestListSkeleton />
          ) : receivedQuery.error ? (
            <RequestListError
              message={receivedQuery.error.message}
              onRetry={() => void receivedQuery.refetch()}
            />
          ) : received.length === 0 ? (
            <EmptyRequests view="received" />
          ) : (
            <div className="space-y-4" aria-live="polite">
              {received.map((request) => (
                <ReceivedTaskRequestCard
                  key={request.requestId}
                  request={request}
                  actionError={actionErrors[request.requestId]}
                  disabled={submitting}
                  onAction={openConfirmation}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          {sentQuery.loading && !sentQuery.data ? (
            <RequestListSkeleton />
          ) : sentQuery.error ? (
            <RequestListError
              message={sentQuery.error.message}
              onRetry={() => void sentQuery.refetch()}
            />
          ) : sent.length === 0 ? (
            <EmptyRequests view="sent" />
          ) : (
            <div className="space-y-4" aria-live="polite">
              {sent.map((request) => (
                <SentTaskRequestCard
                  key={request.requestId}
                  request={request}
                  actionError={actionErrors[request.requestId]}
                  disabled={submitting}
                  onAction={openConfirmation}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {confirmation && (
        <TaskRequestActionDialog
          key={`${confirmation.action}-${confirmation.request.requestId}`}
          action={confirmation.action}
          request={confirmation.request}
          open
          submitting={submitting}
          errorMessage={actionErrors[confirmation.request.requestId]}
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
          onConfirm={performConfirmedAction}
        />
      )}
    </div>
  );
}
