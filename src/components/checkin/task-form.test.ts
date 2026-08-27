import { describe, expect, it } from "vitest";
import {
  DEFAULT_TASK_TYPE,
  TASK_TYPES,
  getCheckoutStatusOptions,
  getTaskEditMode,
  isKpiReadyForAchievementSubmission,
  normalizeCheckoutStatus,
  requiresLinkedKpi,
} from "./task-form";

describe("check-in task form defaults", () => {
  it("keeps KPI_UNMET first and selected by default", () => {
    expect(DEFAULT_TASK_TYPE).toBe("KPI_UNMET");
    expect(TASK_TYPES[0]).toEqual({
      value: "KPI_UNMET",
      label: "KPI Unmet",
    });
  });

  it("identifies approved KPIs that are ready for achievement submission", () => {
    expect(
      isKpiReadyForAchievementSubmission({
        status: "APPROVED",
        quarterPlans: [
          { status: "LOCKED" },
          { status: "APPROVED" },
          { status: "APPROVED" },
          { status: "APPROVED" },
        ],
      }),
    ).toBe(true);
    expect(
      isKpiReadyForAchievementSubmission({
        status: "APPROVED",
        quarterPlans: [{ status: "DRAFT" }],
      }),
    ).toBe(false);
    expect(
      isKpiReadyForAchievementSubmission({
        status: "DRAFT",
        quarterPlans: [{ status: "APPROVED" }],
      }),
    ).toBe(false);
  });

  it("derives planning and checkout edit modes from submission status", () => {
    expect(getTaskEditMode("DRAFT")).toBe("PLANNING");
    expect(getTaskEditMode("PERSONAL_TODO")).toBe("PLANNING");
    expect(getTaskEditMode("SUBMITTED")).toBe("CHECKOUT");
    expect(getTaskEditMode(undefined)).toBe("CHECKOUT");
  });

  it("requires links for KPI outcomes and forces fulfilled outcomes to DONE", () => {
    expect(requiresLinkedKpi("KPI_FULFILLED")).toBe(true);
    expect(requiresLinkedKpi("KPI_UNMET")).toBe(true);
    expect(requiresLinkedKpi("UNLINKED")).toBe(false);
    expect(getCheckoutStatusOptions("KPI_FULFILLED")).toEqual([
      { value: "DONE", label: "Done" },
    ]);
    expect(normalizeCheckoutStatus("KPI_FULFILLED", "POSTPONED")).toBe(
      "DONE",
    );
    expect(normalizeCheckoutStatus("KPI_UNMET", "POSTPONED")).toBe(
      "POSTPONED",
    );
  });

  it("uses the fulfilled and unmet self-development API values", () => {
    expect(TASK_TYPES.map((type) => type.value)).toContain(
      "SELF_DEVELOPMENT_FULFILLED",
    );
    expect(TASK_TYPES.map((type) => type.value)).toContain(
      "SELF_DEVELOPMENT_UNMET",
    );
  });
});
