/**
 * Task schedule validation utilities
 */

export interface OverlapFeedback {
  inlineMessage: string;
  toastDescription: string;
}

/**
 * Validate that task time range is valid (start before end, reasonable duration)
 */
export function validateTaskTimeRange(
  startDateTime: Date,
  endDateTime: Date,
): string | null {
  if (startDateTime >= endDateTime) {
    return "Task start time must be before end time.";
  }

  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  if (durationMinutes < 15) {
    return "Task must be at least 15 minutes long.";
  }

  if (durationMinutes > 24 * 60) {
    return "Task cannot be longer than 24 hours.";
  }

  return null;
}

/**
 * Extract overlap feedback from GraphQL error
 * Parses the enhanced error message from the backend
 */
export function getTaskOverlapFeedback(
  error: unknown,
): OverlapFeedback | null {
  // Check if it's a GraphQL error with our enhanced message
  const errorMessage = getErrorMessage(error);

  if (!errorMessage) return null;

  // Check if it's a time conflict error
  if (errorMessage.includes("Time conflict:")) {
    // Extract the parts of the error message
    const parts = errorMessage.split("Available times:");
    const conflictPart = parts[0].replace("Time conflict:", "").trim();
    const availablePart = parts[1]?.trim() || "Please try a different time.";

    return {
      inlineMessage: `${conflictPart}\n\n💡 ${availablePart}`,
      toastDescription: `${conflictPart} Try: ${availablePart}`,
    };
  }

  // Check for other overlap-related errors
  if (
    errorMessage.includes("overlap") ||
    errorMessage.includes("conflict") ||
    errorMessage.includes("scheduled")
  ) {
    return {
      inlineMessage: errorMessage,
      toastDescription: errorMessage,
    };
  }

  return null;
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string | null {
  if (!error) return null;

  // Apollo GraphQL error
  if (typeof error === "object" && error !== null) {
    const apolloError = error as any;

    // Check graphQLErrors array
    if (
      Array.isArray(apolloError.graphQLErrors) &&
      apolloError.graphQLErrors.length > 0
    ) {
      return apolloError.graphQLErrors[0]?.message || null;
    }

    // Check message property
    if (typeof apolloError.message === "string") {
      return apolloError.message;
    }

    // Check networkError
    if (apolloError.networkError?.result?.errors?.[0]?.message) {
      return apolloError.networkError.result.errors[0].message;
    }
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  // Error object
  if (error instanceof Error) {
    return error.message;
  }

  return null;
}
