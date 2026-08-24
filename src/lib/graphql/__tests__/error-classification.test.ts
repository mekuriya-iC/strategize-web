import { describe, expect, it } from "vitest";
import { isExpectedGraphqlBusinessError } from "../error-classification";

describe("GraphQL error classification", () => {
  it("classifies task scheduling conflicts as expected business errors", () => {
    expect(
      isExpectedGraphqlBusinessError(
        'Task time overlaps with existing task "Meet with investify".',
      ),
    ).toBe(true);
  });

  it("classifies unapproved quarter plans as expected governance errors", () => {
    expect(
      isExpectedGraphqlBusinessError(
        "Logbook achievement cannot be submitted or approved while Q1 plan is DRAFT.",
      ),
    ).toBe(true);
  });

  it("does not suppress unexpected server failures", () => {
    expect(
      isExpectedGraphqlBusinessError("Unexpected database connection failure"),
    ).toBe(false);
  });
});
