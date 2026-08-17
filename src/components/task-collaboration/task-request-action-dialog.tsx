"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TaskCollaborationRequest } from "@/lib/graphql/queries/task-collaboration";
import type { TaskCollaborationAction } from "./task-collaboration-utils";

const ACTION_COPY: Record<
  TaskCollaborationAction,
  { title: string; description: string; confirmLabel: string }
> = {
  accept: {
    title: "Accept collaboration request?",
    description:
      "This creates a private draft in your matching week. If that week was already submitted, the task will be added as a personal to-do instead.",
    confirmLabel: "Accept request",
  },
  reject: {
    title: "Reject collaboration request?",
    description:
      "The originator will see that you rejected the request and any response you include.",
    confirmLabel: "Reject request",
  },
  cancel: {
    title: "Cancel collaboration request?",
    description:
      "The collaborator will no longer be able to accept this pending request.",
    confirmLabel: "Cancel request",
  },
};

interface TaskRequestActionDialogProps {
  action: TaskCollaborationAction;
  request: TaskCollaborationRequest;
  open: boolean;
  submitting: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (responseMessage?: string) => Promise<boolean>;
}

export function TaskRequestActionDialog({
  action,
  request,
  open,
  submitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: TaskRequestActionDialogProps) {
  const [responseMessage, setResponseMessage] = useState("");
  const copy = ACTION_COPY[action];
  const allowsResponse = action === "accept" || action === "reject";

  const handleConfirm = async () => {
    const succeeded = await onConfirm(responseMessage.trim() || undefined);
    if (succeeded) onOpenChange(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{request.originatorTask.taskTitle}</p>
          <p className="mt-1 text-muted-foreground">
            {action === "cancel"
              ? `Requested from ${request.collaboratorEmployee.fullName}`
              : `Requested by ${request.originatorEmployee.fullName}`}
          </p>
        </div>

        {allowsResponse && (
          <div className="space-y-2">
            <Label htmlFor={`response-${request.requestId}`}>
              Response message <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={`response-${request.requestId}`}
              value={responseMessage}
              onChange={(event) => setResponseMessage(event.target.value)}
              placeholder="Add context for the originator"
              maxLength={1000}
              disabled={submitting}
            />
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Keep request
          </Button>
          <Button
            type="button"
            variant={action === "accept" ? "default" : "destructive"}
            disabled={submitting}
            onClick={() => void handleConfirm()}
          >
            {submitting ? "Updating…" : copy.confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
