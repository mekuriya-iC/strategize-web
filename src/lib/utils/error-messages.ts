/**
 * Utility functions to convert technical error messages into user-friendly messages
 */

interface ForeignKeyConstraint {
  table: string;
  constraint: string;
  friendlyName: string;
  message: string;
}

// Map of foreign key constraints to user-friendly messages
const FOREIGN_KEY_CONSTRAINTS: ForeignKeyConstraint[] = [
  {
    table: "Employee",
    constraint: "FK_2d1fabe28647bca2bd5581531f9",
    friendlyName: "Division Manager",
    message: "This employee is assigned as a manager of one or more divisions. Please reassign the division manager(s) before deleting this employee.",
  },
  {
    table: "Employee",
    constraint: "FK_department_manager",
    friendlyName: "Department Manager",
    message: "This employee is assigned as a manager of one or more departments. Please reassign the department manager(s) before deleting this employee.",
  },
  {
    table: "Employee",
    constraint: "FK_team_lead",
    friendlyName: "Team Lead",
    message: "This employee is assigned as a team lead. Please reassign the team lead before deleting this employee.",
  },
  {
    table: "Department",
    constraint: "FK_department_division",
    friendlyName: "Department in Division",
    message: "This department is part of a division. Please remove the department from the division or delete the division first.",
  },
  {
    table: "Team",
    constraint: "FK_team_department",
    friendlyName: "Team in Department",
    message: "This team belongs to a department. Please remove the team from the department or delete the department first.",
  },
  {
    table: "Division",
    constraint: "FK_division_departments",
    friendlyName: "Division with Departments",
    message: "This division has departments assigned to it. Please remove or delete all departments in this division first.",
  },
  {
    table: "Objective",
    constraint: "FK_objective_kpis",
    friendlyName: "Objective with KPIs",
    message: "This objective has KPIs assigned to it. Please remove or delete all KPIs before deleting this objective.",
  },
  {
    table: "StrategicPlan",
    constraint: "FK_strategic_plan_objectives",
    friendlyName: "Strategic Plan with Objectives",
    message: "This strategic plan has objectives assigned to it. Please remove or delete all objectives before deleting this plan.",
  },
];

/**
 * Parse a GraphQL error and return a user-friendly message
 */
export function parseGraphQLError(error: any): string {
  // Handle null/undefined
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  // Extract error message
  let errorMessage = "";
  
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    errorMessage = error.graphQLErrors[0].message;
  } else if (error.networkError) {
    return "Network error. Please check your connection and try again.";
  }

  // Check for foreign key constraint violations
  const foreignKeyMatch = errorMessage.match(/violates foreign key constraint "([^"]+)"/);
  if (foreignKeyMatch) {
    const constraintName = foreignKeyMatch[1];
    const constraint = FOREIGN_KEY_CONSTRAINTS.find(
      (c) => c.constraint === constraintName
    );
    
    if (constraint) {
      return constraint.message;
    }
    
    // Generic foreign key error
    return "This record cannot be deleted because it is referenced by other records. Please remove the related records first.";
  }

  // Check for other common database errors
  if (errorMessage.includes("duplicate key") || errorMessage.includes("unique constraint")) {
    return "A record with this information already exists. Please use a different value.";
  }

  if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
    return "The requested record was not found. It may have been deleted.";
  }

  if (errorMessage.includes("Unauthorized") || errorMessage.includes("unauthorized")) {
    return "You don't have permission to perform this action.";
  }

  if (errorMessage.includes("validation failed") || errorMessage.includes("invalid")) {
    return "The provided information is invalid. Please check your input and try again.";
  }

  // Return the original message if we can't parse it
  return errorMessage || "An unexpected error occurred. Please try again.";
}

/**
 * Get a user-friendly error message for a specific operation
 */
export function getOperationErrorMessage(
  operation: "create" | "update" | "delete",
  resourceType: string,
  error: any
): string {
  const parsedError = parseGraphQLError(error);
  
  // If it's already a user-friendly message, return it
  if (!parsedError.includes("FK_") && !parsedError.includes("constraint")) {
    return parsedError;
  }

  // Otherwise, add context
  const operationText = {
    create: "create",
    update: "update",
    delete: "delete",
  }[operation];

  return `Failed to ${operationText} ${resourceType}: ${parsedError}`;
}
