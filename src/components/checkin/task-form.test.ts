import { describe, expect, it } from "vitest";
import {
  DEFAULT_TASK_TYPE,
  TASK_TYPES,
  getCheckoutStatusOptions,
  getTaskEditMode,
  getPlanningCollaborationFields,
  getStatusAfterTaskTypeChange,
  isKpiReadyForAchievementSubmission,
  normalizeCheckoutStatus,
  requiresCheckoutEvidence,
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
    expect(getTaskEditMode("draft")).toBe("PLANNING");
    expect(getTaskEditMode("PENDING_APPROVAL")).toBe("CHECKOUT");
    expect(getTaskEditMode("APPROVED")).toBe("CHECKOUT");
    expect(getTaskEditMode("PERSONAL_TODO")).toBe("PLANNING");
    expect(getTaskEditMode("SUBMITTED")).toBe("CHECKOUT");
    expect(getTaskEditMode(undefined)).toBe("CHECKOUT");
  });

  it("does not send collaboration edits when saving an unchanged draft relationship", () => {
    expect(getPlanningCollaborationFields({}, "", "")).toEqual({});
    expect(
      getPlanningCollaborationFields(
        { relatedToEmployeeId: "person" },
        "person",
        "",
      ),
    ).toEqual({});
    expect(getPlanningCollaborationFields({}, "person", " Hello ")).toEqual({
      relatedToEmployeeId: "person",
      collaborationRequestMessage: "Hello",
    });
    expect(
      getPlanningCollaborationFields({ relatedToEmployeeId: "person" }, "", ""),
    ).toEqual({ relatedToEmployeeId: null });
    expect(getPlanningCollaborationFields(undefined, "", "")).toEqual({
      relatedToEmployeeId: null,
    });
  });

  it("allows changing fulfilled draft tasks without inheriting a forced DONE status", () => {
    expect(
      getStatusAfterTaskTypeChange("KPI_FULFILLED", "KPI_UNMET", "DONE"),
    ).toBe("NOT_DONE");
    expect(
      getStatusAfterTaskTypeChange("KPI_UNMET", "KPI_FULFILLED", "NOT_DONE"),
    ).toBe("DONE");
    expect(
      getStatusAfterTaskTypeChange("UNLINKED", "KPI_UNMET", "POSTPONED"),
    ).toBe("POSTPONED");
  });

  it("requires links for KPI outcomes and forces fulfilled outcomes to DONE", () => {
    expect(requiresLinkedKpi("KPI_FULFILLED")).toBe(true);
    expect(requiresLinkedKpi("KPI_UNMET")).toBe(true);
    expect(requiresLinkedKpi("UNLINKED")).toBe(false);
    expect(getCheckoutStatusOptions("KPI_FULFILLED")).toEqual([
      { value: "DONE", label: "Done" },
    ]);
    expect(normalizeCheckoutStatus("KPI_FULFILLED", "POSTPONED")).toBe("DONE");
    expect(normalizeCheckoutStatus("KPI_UNMET", "POSTPONED")).toBe("POSTPONED");
  });

  it("requires checkout evidence for done unmet and initiative fulfilled tasks", () => {
    expect(requiresCheckoutEvidence("KPI_UNMET", "DONE")).toBe(true);
    expect(requiresCheckoutEvidence("INITIATIVE_UNMET", "DONE")).toBe(true);
    expect(requiresCheckoutEvidence("SELF_DEVELOPMENT_UNMET", "DONE")).toBe(
      true,
    );
    expect(requiresCheckoutEvidence("INITIATIVE_FULFILLED", "DONE")).toBe(true);
    expect(requiresCheckoutEvidence("KPI_UNMET", "NOT_DONE")).toBe(false);
    expect(requiresCheckoutEvidence("INITIATIVE_FULFILLED", "POSTPONED")).toBe(
      false,
    );
    expect(requiresCheckoutEvidence("KPI_FULFILLED", "DONE")).toBe(false);
    expect(requiresCheckoutEvidence("SELF_DEVELOPMENT_FULFILLED", "DONE")).toBe(
      false,
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
