import { describe, expect, it } from "vitest";
import {
  canCreateInitiativeForObjective,
  deriveInitiativeScope,
  type InitiativeObjectiveAccess,
  type InitiativeObjectiveChoice,
} from "./scope";

const access: InitiativeObjectiveAccess = {
  isAdmin: false,
  employeeId: "employee-1",
  managedDivisionIds: ["division-1"],
  managedDepartmentIds: ["department-1"],
};

const objective = (
  type: InitiativeObjectiveChoice["type"],
  assigneeId?: string
): InitiativeObjectiveChoice => ({
  objectiveId: `${type}-objective`,
  title: `${type} objective`,
  type,
  assigneeId,
});

describe("initiative objective scope", () => {
  it("maps corporate objectives to the authenticated organization", () => {
    expect(deriveInitiativeScope(objective("CORPORATE"), "organization-1")).toEqual({
      scopeType: "ORGANIZATION",
      scopeId: "organization-1",
    });
  });

  it.each([
    ["DIVISION", "DIVISION", "division-1"],
    ["DEPARTMENT", "DEPARTMENT", "department-1"],
    ["PERSONNEL", "PERSONNEL", "employee-1"],
    ["EMPLOYEE", "PERSONNEL", "employee-1"],
  ] as const)("maps %s objectives to %s scope", (type, scopeType, assigneeId) => {
    expect(deriveInitiativeScope(objective(type, assigneeId), "organization-1")).toEqual({
      scopeType,
      scopeId: assigneeId,
    });
  });

  it("requires an assignee for non-corporate objectives", () => {
    expect(deriveInitiativeScope(objective("DIVISION"), "organization-1")).toBeNull();
    expect(deriveInitiativeScope(objective("PERSONNEL"), "organization-1")).toBeNull();
  });

  it("allows admins to choose organization objectives", () => {
    expect(
      canCreateInitiativeForObjective(objective("CORPORATE"), {
        ...access,
        isAdmin: true,
      })
    ).toBe(true);
    expect(canCreateInitiativeForObjective(objective("CORPORATE"), access)).toBe(false);
  });

  it("limits unit and personnel objectives to managed IDs and employee self", () => {
    expect(canCreateInitiativeForObjective(objective("DIVISION", "division-1"), access)).toBe(true);
    expect(canCreateInitiativeForObjective(objective("DIVISION", "division-2"), access)).toBe(false);
    expect(canCreateInitiativeForObjective(objective("DEPARTMENT", "department-1"), access)).toBe(true);
    expect(canCreateInitiativeForObjective(objective("DEPARTMENT", "department-2"), access)).toBe(false);
    expect(canCreateInitiativeForObjective(objective("PERSONNEL", "employee-1"), access)).toBe(true);
    expect(canCreateInitiativeForObjective(objective("EMPLOYEE", "employee-1"), access)).toBe(true);
    expect(canCreateInitiativeForObjective(objective("PERSONNEL", "employee-2"), access)).toBe(false);
  });
});
