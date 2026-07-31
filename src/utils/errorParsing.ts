/**
 * Shared GraphQL error parsing utility.
 * Converts raw Apollo/GraphQL errors into user-friendly title + description pairs.
 */

export interface ParsedError {
  title: string;
  description: string;
}

/**
 * Extracts a readable message string from any error shape Apollo may throw.
 */
function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  // ApolloError wraps graphQLErrors
  const e = error as any;
  if (e?.graphQLErrors?.[0]?.message) return e.graphQLErrors[0].message;
  if (e?.networkError?.message) return e.networkError.message;
  return String(error);
}

/**
 * Parse any GraphQL / network error into a user-friendly title + description.
 * Pass an optional `entityLabel` (e.g. "Employee", "Objective") to customise
 * the fallback message.
 */
export function parseGraphQLError(
  error: unknown,
  entityLabel = "record"
): ParsedError {
  const msg = extractMessage(error).toLowerCase();

  // ── Protected approval workflow fields ─────────────────────────────────────
  if (
    msg.includes("workflow fields") ||
    msg.includes("submission approval workflow")
  ) {
    return {
      title: "Approval Status Cannot Be Edited Here",
      description:
        "Use the Submit, Approve, or Reject action to change this objective's workflow status.",
    };
  }

  // ── Duplicate / unique constraint ──────────────────────────────────────────
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    if (msg.includes("email") || msg.includes("uq_")) {
      return {
        title: "Email Already Exists",
        description:
          "This email address is already registered. Please use a different email address.",
      };
    }
    if (msg.includes("phone")) {
      return {
        title: "Phone Number Already Exists",
        description:
          "This phone number is already registered. Please use a different phone number.",
      };
    }
    return {
      title: "Duplicate Information",
      description:
        "Some of the information you entered already exists in the system. Please check your entries.",
    };
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (msg.includes("not found")) {
    return {
      title: "Not Found",
      description: `The ${entityLabel} you are trying to modify no longer exists. Please refresh the page.`,
    };
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  if (msg.includes("validation") || msg.includes("invalid")) {
    return {
      title: "Invalid Information",
      description:
        "Please check your entries and make sure all information is valid.",
    };
  }

  // ── Network / connectivity ─────────────────────────────────────────────────
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("failed to fetch") ||
    msg.includes("econnrefused")
  ) {
    return {
      title: "Connection Error",
      description:
        "Unable to reach the server. Please check your internet connection and try again.",
    };
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (
    msg.includes("unauthorized") ||
    msg.includes("unauthenticated") ||
    msg.includes("forbidden") ||
    msg.includes("jwt")
  ) {
    return {
      title: "Permission Denied",
      description:
        "You don't have permission to perform this action. Please contact your administrator.",
    };
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const capitalised =
    entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);
  return {
    title: `Failed to update ${capitalised}`,
    description:
      "Something went wrong. Please try again or contact support if the problem persists.",
  };
}
