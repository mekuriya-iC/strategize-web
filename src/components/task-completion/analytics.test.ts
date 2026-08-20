import { describe, expect, it } from "vitest";
import {
  buildHierarchyTaskCompletionVariables,
  buildPersonalTaskCompletionVariables,
  canViewTeamTaskCompletion,
  createDefaultTaskCompletionFilters,
  getTaskCompletionStatusPresentation,
} from "./analytics";

describe("task completion status presentation", () => {
  it("styles CRITICAL as an explicit critical state", () => {
    const presentation = getTaskCompletionStatusPresentation("CRITICAL");

    expect(presentation.label).toBe("Critical");
    expect(presentation.isCritical).toBe(true);
    expect(presentation.className).toContain("red");
  });

  it("treats NO_DATA as neutral rather than critical", () => {
    const presentation = getTaskCompletionStatusPresentation("NO_DATA");

    expect(presentation.label).toBe("No data");
    expect(presentation.description).toContain("No official tasks");
    expect(presentation.isCritical).toBe(false);
    expect(presentation.className).toContain("slate");
    expect(presentation.className).not.toContain("red");
  });
});

describe("task completion query variables", () => {
  it("builds personal variables without hierarchy-only filters", () => {
    const filters = {
      ...createDefaultTaskCompletionFilters(
        "MONTHLY",
        new Date(2026, 7, 17),
      ),
      strategicPeriodId: "  strategic-period-1  ",
      status: "GOOD" as const,
      employeeId: "employee-1",
      departmentId: "department-1",
    };

    expect(buildPersonalTaskCompletionVariables(filters)).toEqual({
      filters: {
        periodType: "MONTHLY",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        strategicPeriodId: "strategic-period-1",
        status: "GOOD",
        page: 1,
        limit: 25,
        sortBy: "PERIOD_START",
        sortDirection: "ASC",
      },
    });
  });

  it("adds trimmed hierarchy filters and omits blank IDs", () => {
    const filters = {
      ...createDefaultTaskCompletionFilters(
        "WEEKLY",
        new Date(2026, 7, 17),
      ),
      employeeId: " employee-1 ",
      departmentId: "   ",
      divisionId: "division-1",
      page: 3,
      sortBy: "COMPLETION_RATE" as const,
      sortDirection: "DESC" as const,
    };

    expect(buildHierarchyTaskCompletionVariables(filters)).toEqual({
      filters: {
        periodType: "WEEKLY",
        startDate: "2026-08-17",
        endDate: "2026-08-23",
        page: 3,
        limit: 25,
        sortBy: "COMPLETION_RATE",
        sortDirection: "DESC",
        employeeId: "employee-1",
        divisionId: "division-1",
      },
    });
  });

  it("only exposes team analytics to the intended UI roles", () => {
    expect(canViewTeamTaskCompletion("MANAGER")).toBe(true);
    expect(canViewTeamTaskCompletion("DIRECTOR")).toBe(true);
    expect(canViewTeamTaskCompletion("HR")).toBe(true);
    expect(canViewTeamTaskCompletion("NORMAL")).toBe(false);
    expect(canViewTeamTaskCompletion("COORDINATOR")).toBe(false);
  });
});
