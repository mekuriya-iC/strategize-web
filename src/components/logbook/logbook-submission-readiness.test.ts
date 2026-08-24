import { describe, expect, it } from "vitest";
import {
  getQuarterPlanSubmissionBlock,
  isQuarterPlanSubmissionError,
} from "./logbook-submission-readiness";

describe("logbook submission readiness", () => {
  it("allows an approved quarter plan", () => {
    expect(
      getQuarterPlanSubmissionBlock("kpi-1", {
        quarterNumber: 1,
        status: "APPROVED",
      }),
    ).toBeNull();
  });

  it("explains that weekly task submission does not approve a draft KPI plan", () => {
    const block = getQuarterPlanSubmissionBlock("kpi-1", {
      quarterNumber: 1,
      status: "DRAFT",
    });

    expect(block?.title).toBe("Q1 target plan is draft");
    expect(block?.description).toContain(
      "Submitting weekly tasks does not approve KPI targets",
    );
  });

  it("allows entries without a linked KPI", () => {
    expect(getQuarterPlanSubmissionBlock(null, null)).toBeNull();
  });

  it("recognizes the API quarter-plan governance error", () => {
    expect(
      isQuarterPlanSubmissionError(
        new Error(
          "Logbook achievement cannot be submitted or approved while Q1 plan is DRAFT.",
        ),
      ),
    ).toBe(true);
  });
});
