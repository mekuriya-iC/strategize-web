interface TaskScheduleErrorLike {
  message?: string;
  graphQLErrors?: Array<{ message?: string }>;
}

export interface TaskOverlapFeedback {
  conflictingTaskName?: string;
  inlineMessage: string;
  toastDescription: string;
}

const OVERLAP_PATTERN = /overlaps with existing task\s+"([^"]+)"/i;

function errorMessages(error: unknown): string[] {
  if (typeof error === "string") return [error];
  if (error instanceof Error) return [error.message];

  const candidate = error as TaskScheduleErrorLike | null;
  return [
    ...(candidate?.graphQLErrors || []).flatMap((item) =>
      item.message ? [item.message] : [],
    ),
    ...(candidate?.message ? [candidate.message] : []),
  ];
}

export function getTaskOverlapFeedback(
  error: unknown,
): TaskOverlapFeedback | null {
  const message = errorMessages(error).find((item) =>
    item.toLowerCase().includes("task time overlaps"),
  );
  if (!message) return null;

  const conflictingTaskName = message.match(OVERLAP_PATTERN)?.[1];
  const conflictLabel = conflictingTaskName
    ? `“${conflictingTaskName}”`
    : "an existing task";

  return {
    conflictingTaskName,
    inlineMessage: `The selected time conflicts with ${conflictLabel}. Adjust the start or end time and try again. Back-to-back tasks are allowed.`,
    toastDescription: `This schedule conflicts with ${conflictLabel}. Your form has been kept so you can adjust the time.`,
  };
}

export function validateTaskTimeRange(
  startDateTime: Date,
  endDateTime: Date,
): string | null {
  if (
    Number.isNaN(startDateTime.getTime()) ||
    Number.isNaN(endDateTime.getTime())
  ) {
    return "Enter a valid start and end date/time.";
  }
  if (startDateTime >= endDateTime) {
    return "End date and time must be after the start date and time.";
  }
  return null;
}
