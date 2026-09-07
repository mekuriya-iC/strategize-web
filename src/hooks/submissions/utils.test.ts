import { describe, expect, it } from "vitest";
import type { MinimalSubmission } from "./types";
import {
  filterSubmissionsByHierarchy,
  getDepartmentIdFromSubmission,
} from "./utils";

const selfCreatedManagerKpi: MinimalSubmission = {
  submissionId: "submission-1",
  type: "KPI",
  level: "DEPARTMENT",
  status: "PENDING",
  submittedBy: {
    employeeId: "manager-1",
    fullName: "Manager One",
    departments: [{ departmentId: "department-1", name: "Sales" }],
  },
  kpi: {
    kpiId: "kpi-1",
    name: "Manager-created KPI",
    objective: {
      objectiveId: "objective-1",
      type: "PERSONNEL",
    },
  },
};

describe("submission hierarchy routing", () => {
  it("uses the creator department for a manager-created KPI without an assignee", () => {
    expect(getDepartmentIdFromSubmission(selfCreatedManagerKpi)).toBe(
      "department-1",
    );
  });

  it("shows that KPI to the director of the containing division", () => {
    expect(
      filterSubmissionsByHierarchy(
        [selfCreatedManagerKpi],
        "DIVISION",
        "division",
        new Set(),
        new Set(["department-1"]),
        "division-1",
      ),
    ).toEqual([selfCreatedManagerKpi]);
  });

  it("keeps an explicitly cascaded department KPI on its assigned department", () => {
    const cascaded = {
      ...selfCreatedManagerKpi,
      kpi: {
        ...selfCreatedManagerKpi.kpi!,
        assigneeType: "DEPARTMENT" as const,
        assigneeId: "department-2",
      },
    };

    expect(getDepartmentIdFromSubmission(cascaded)).toBe("department-2");
  });
});
