export type InitiativeScopeType =
  | "ORGANIZATION"
  | "DIVISION"
  | "DEPARTMENT"
  | "PERSONNEL";

export interface InitiativeObjectiveChoice {
  objectiveId: string;
  title: string;
  type: "CORPORATE" | "DIVISION" | "DEPARTMENT" | "PERSONNEL" | "EMPLOYEE";
  assigneeId?: string | null;
}

export interface InitiativeObjectiveAccess {
  isAdmin: boolean;
  employeeId?: string;
  managedDivisionIds: string[];
  managedDepartmentIds: string[];
}

export interface InitiativeScope {
  scopeType: InitiativeScopeType;
  scopeId: string;
}

export function canCreateInitiativeForObjective(
  objective: InitiativeObjectiveChoice,
  access: InitiativeObjectiveAccess
): boolean {
  if (objective.type === "CORPORATE") return access.isAdmin;
  if (!objective.assigneeId) return false;

  switch (objective.type) {
    case "DIVISION":
      return access.managedDivisionIds.includes(objective.assigneeId);
    case "DEPARTMENT":
      return access.managedDepartmentIds.includes(objective.assigneeId);
    case "PERSONNEL":
    case "EMPLOYEE":
      return objective.assigneeId === access.employeeId;
    default:
      return false;
  }
}

export function deriveInitiativeScope(
  objective: InitiativeObjectiveChoice,
  organizationId: string
): InitiativeScope | null {
  if (objective.type === "CORPORATE") {
    return organizationId
      ? { scopeType: "ORGANIZATION", scopeId: organizationId }
      : null;
  }

  if (!objective.assigneeId) return null;

  switch (objective.type) {
    case "DIVISION":
      return { scopeType: "DIVISION", scopeId: objective.assigneeId };
    case "DEPARTMENT":
      return { scopeType: "DEPARTMENT", scopeId: objective.assigneeId };
    case "PERSONNEL":
    case "EMPLOYEE":
      return { scopeType: "PERSONNEL", scopeId: objective.assigneeId };
    default:
      return null;
  }
}
