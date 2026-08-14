/**
 * Error Handling Utilities
 * Converts technical errors into user-friendly messages
 */

import { toast } from "sonner";

interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    statusCode?: number;
  };
  path?: string[];
}

interface ApolloError {
  message: string;
  graphQLErrors?: GraphQLError[];
  networkError?: {
    message: string;
    statusCode?: number;
  };
}

interface ErrorToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

/**
 * Extract user-friendly message from Apollo error
 */
export function extractErrorMessage(error: any): string {
  // Handle Apollo errors with GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].message;
  }

  // Handle network errors
  if (error.networkError) {
    if (error.networkError.statusCode === 401) {
      return "Session expired. Please log in again.";
    }
    if (error.networkError.statusCode === 403) {
      return "You don't have permission to perform this action.";
    }
    if (error.networkError.statusCode === 500) {
      return "Server error. Please try again later.";
    }
    return "Network error. Please check your connection.";
  }

  // Fallback to error message
  return error.message || "An unexpected error occurred. Please try again.";
}

/**
 * Get contextual description for specific error types
 */
function getErrorDescription(message: string): string | undefined {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("overlap")) {
    return "Please choose a different time slot for this task.";
  }

  if (lowerMessage.includes("action verb") || lowerMessage.includes("qualifying verb")) {
    return "Start with: Prepare, Submit, Meet, Review, Complete, etc.";
  }

  if (lowerMessage.includes("description") && lowerMessage.includes("required")) {
    return "Provide at least 10 characters explaining what needs to be done.";
  }

  if (lowerMessage.includes("locked")) {
    return "This session is locked and cannot be modified.";
  }

  if (lowerMessage.includes("permission") || lowerMessage.includes("forbidden")) {
    return "Contact your supervisor if you need access.";
  }

  if (lowerMessage.includes("not found")) {
    return "The item may have been deleted or moved.";
  }

  if (lowerMessage.includes("duplicate") || lowerMessage.includes("already exists")) {
    return "An item with this information already exists.";
  }

  return undefined;
}

/**
 * Get appropriate duration based on error message length
 */
function getErrorDuration(message: string): number {
  if (message.length > 100) return 8000; // 8 seconds for long messages
  if (message.length > 50) return 6000;  // 6 seconds for medium messages
  return 4000; // 4 seconds for short messages
}

/**
 * Show user-friendly error toast
 */
export function showErrorToast(error: any, options?: ErrorToastOptions) {
  const message = extractErrorMessage(error);
  const description = options?.description || getErrorDescription(message);
  const duration = options?.duration || getErrorDuration(message);

  // Log to console for debugging (but not visible to user)
  console.error("[Error Handler]", {
    originalError: error,
    displayMessage: message,
    description,
  });

  toast.error(options?.title || message, {
    description,
    duration,
  });
}

/**
 * Show success toast with consistent styling
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Show warning toast
 */
export function showWarningToast(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 3000,
  });
}

/**
 * Categorize errors for better handling
 */
export function categorizeError(error: any): {
  category: "validation" | "permission" | "network" | "auth" | "server" | "unknown";
  message: string;
} {
  const message = extractErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("required") ||
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("must") ||
    lowerMessage.includes("overlap")
  ) {
    return { category: "validation", message };
  }

  if (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("forbidden") ||
    lowerMessage.includes("not allowed")
  ) {
    return { category: "permission", message };
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("fetch failed")
  ) {
    return { category: "network", message };
  }

  if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("unauthenticated") ||
    lowerMessage.includes("expired")
  ) {
    return { category: "auth", message };
  }

  if (
    lowerMessage.includes("server error") ||
    lowerMessage.includes("internal error") ||
    (error.networkError?.statusCode && error.networkError.statusCode >= 500)
  ) {
    return { category: "server", message };
  }

  return { category: "unknown", message };
}

/**
 * Check if error should be shown to user
 * Some errors are internal and should only be logged
 */
export function shouldShowError(error: any): boolean {
  const message = extractErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  // Don't show "not found" errors as toasts (handled by UI state)
  if (lowerMessage.includes("not found") && lowerMessage.length < 50) {
    return false;
  }

  // Don't show duplicate console errors
  if (lowerMessage.includes("console.error")) {
    return false;
  }

  return true;
}
