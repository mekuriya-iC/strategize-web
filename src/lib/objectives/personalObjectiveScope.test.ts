import { describe, expect, it } from "vitest";
import { isPersonalObjectiveAssignment, usesPersonalObjectiveScope } from "./personalObjectiveScope";

describe("personal objective ownership", () => {
  it("scopes all personal-view roles and unresolved identity, without changing management views", () => {
    for (const role of ["NORMAL", "HR", undefined]) expect(usesPersonalObjectiveScope(role)).toBe(true);
    for (const role of ["ADMIN", "SUPER_ADMIN", "DIRECTOR", "MANAGER", "COORDINATOR"]) expect(usesPersonalObjectiveScope(role)).toBe(false);
  });
  const rows = [
    {
      objectiveId: "personal-1",
      assigneeType: "PERSONNEL",
      assigneeId: "me",
      weight: 34.37,
    },
    {
      objectiveId: "personal-2",
      assigneeType: "PERSONNEL",
      assigneeId: "me",
      weight: 5,
    },
    ...[33, 16, 14, 8, 17, 12].map((weight, index) => ({
      objectiveId: `corporate-${index}`,
      assigneeType: null,
      assigneeId: null,
      weight,
    })),
  ];
  it("excludes all six corporate roots from the employee list and its weights", () => {
    const mine = rows.filter((row) => isPersonalObjectiveAssignment(row, "me"));
    expect(mine.map((row) => row.objectiveId)).toEqual([
      "personal-1",
      "personal-2",
    ]);
    expect(mine.reduce((sum, row) => sum + row.weight, 0)).toBeCloseTo(39.37);
    expect(rows).toHaveLength(8); // Parent lookup remains intact; nothing is deleted.
  });
  it("rejects other employees, units, and unresolved identity even if IDs match", () => {
    expect(
      isPersonalObjectiveAssignment(
        { assigneeType: "PERSONNEL", assigneeId: "other" },
        "me",
      ),
    ).toBe(false);
    expect(
      isPersonalObjectiveAssignment(
        { assigneeType: "DEPARTMENT", assigneeId: "me" },
        "me",
      ),
    ).toBe(false);
    expect(
      isPersonalObjectiveAssignment({ assigneeType: "PERSONNEL" }, undefined),
    ).toBe(false);
    expect(isPersonalObjectiveAssignment({}, undefined)).toBe(false);
  });
  it("retains independently assigned personnel objectives without requiring a parent", () => {
    expect(
      isPersonalObjectiveAssignment(
        { assigneeType: "PERSONNEL", assigneeId: "me" },
        "me",
      ),
    ).toBe(true);
  });
});
